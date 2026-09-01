/* CS#23.3 live probe — organization administration, real parents, settings,
   cross-tenant isolation, against the running API. */
const BASE = "http://localhost:4000";

async function api(method, url, token, body) {
  const res = await fetch(BASE + url, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json };
}

async function loginToken(email) {
  const res = await api("POST", "/api/auth/login", null, {
    email,
    password: "Test@1234",
  });
  if (res.status !== 200) {
    console.error(`login failed for ${email}: ${res.status}`, res.json);
    return null;
  }
  return res.json?.token ?? res.json?.accessToken ?? res.json?.data?.token ?? null;
}

const { prisma } = require("@aratc/database");
let pass = 0;
let fail = 0;
function t(name, ok, extra = "") {
  if (ok) {
    pass++;
    console.log(`PASS  ${name}${extra ? ` — ${extra}` : ""}`);
  } else {
    fail++;
    console.log(`FAIL  ${name}${extra ? ` — ${extra}` : ""}`);
  }
}

async function main() {
  // ---- Fixtures (read directly from DB — the source of truth) ----
  const arc = await prisma.organization.findFirst({ where: { slug: "arc-review-center" } });
  const nino = await prisma.organization.findFirst({ where: { slug: { contains: "nino" } } });
  const parentUser = await prisma.user.findUnique({ where: { email: "parent@aratc.edu.ph" } });
  const studentUser = await prisma.user.findUnique({ where: { email: "demo.student@aratc.edu.ph" } });
  const externalUser = await prisma.user.findUnique({ where: { email: "demo.external@aratc.edu.ph" } });
  if (!arc || !parentUser || !studentUser || !externalUser) {
    console.error("Missing fixtures", { arc: !!arc, parentUser: !!parentUser, studentUser: !!studentUser, externalUser: !!externalUser });
    process.exit(1);
  }
  const ARC = arc.id;

  const [superT, adminT, studentT, externalT] = await Promise.all([
    loginToken("demo.superadmin@aratc.edu.ph"),
    loginToken("demo.admin@aratc.edu.ph"),
    loginToken("demo.student@aratc.edu.ph"),
    loginToken("demo.external@aratc.edu.ph"),
  ]);
  t("logins (superadmin/admin/student/external)", !!superT && !!adminT && !!studentT && !!externalT);

  // ---- §38: 401 / 403 guards ----
  const anon = await api("GET", `/api/organizations/${ARC}/members`, null);
  t("anon GET members → 401", anon.status === 401, `status=${anon.status}`);

  const stu = await api("GET", `/api/organizations/${ARC}/members`, studentT);
  t("student GET members → 403", stu.status === 403, `status=${stu.status}`);

  const stuOverview = await api("GET", `/api/organizations/${ARC}/overview`, studentT);
  t("student GET overview → 403", stuOverview.status === 403, `status=${stuOverview.status}`);

  const stuParents = await api("GET", `/api/organizations/${ARC}/parents`, studentT);
  t("student GET parents → 403", stuParents.status === 403, `status=${stuParents.status}`);

  const stuSettings = await api("GET", `/api/organizations/${ARC}/settings`, studentT);
  t("student GET settings → 403", stuSettings.status === 403, `status=${stuSettings.status}`);

  const stuCreate = await api("POST", `/api/organizations/${ARC}/users`, studentT, {
    email: "x@y.z", password: "longenough1", firstName: "X", lastName: "Y", role: "student",
  });
  t("student POST users → 403", stuCreate.status === 403, `status=${stuCreate.status}`);

  // ---- §14/§35: cross-tenant isolation ----
  const ninoAsAdmin = await api("GET", `/api/organizations/${nino.id}/members`, adminT);
  t("ARC admin GET Sto.Niño members → 403", ninoAsAdmin.status === 403, `status=${ninoAsAdmin.status}`);

  const ninoAsSuper = await api("GET", `/api/organizations/${nino.id}/members`, superT);
  t("superadmin GET Sto.Niño members → 200", ninoAsSuper.status === 200, `status=${ninoAsSuper.status}`);

  // ---- §5/§6: real members + server-side search/filters ----
  const members = await api("GET", `/api/organizations/${ARC}/members`, adminT);
  const memberList = members.json?.members ?? [];
  t("ARC admin GET members → 200 (real data)", members.status === 200 && memberList.length > 0, `count=${memberList.length}`);
  t("members include demo.student as LEARNER",
    memberList.some((m) => m.user?.email === "demo.student@aratc.edu.ph" && m.role === "LEARNER"));

  const searched = await api("GET", `/api/organizations/${ARC}/members?q=demo.student`, adminT);
  const searchList = searched.json?.members ?? [];
  t("server-side search q=demo.student", searched.status === 200 && searchList.length >= 1, `count=${searchList.length}`);

  const learners = await api("GET", `/api/organizations/${ARC}/members?role=LEARNER`, adminT);
  const learnerList = learners.json?.members ?? [];
  t("filter role=LEARNER", learners.status === 200 && learnerList.length > 0 && learnerList.every((m) => m.role === "LEARNER"));

  // ---- §7: member detail ----
  const detail = await api("GET", `/api/organizations/${ARC}/members/${studentUser.id}`, adminT);
  t("member detail → 200 with membership + system roles",
    detail.status === 200 && !!detail.json?.member?.membership && Array.isArray(detail.json?.member?.systemRoles));

  const detailCross = await api("GET", `/api/organizations/${nino.id}/members/${studentUser.id}`, adminT);
  t("member detail cross-org → 403", detailCross.status === 403, `status=${detailCross.status}`);

  // ---- §22/§23: overview real counts ----
  const overview = await api("GET", `/api/organizations/${ARC}/overview`, adminT);
  const ov = overview.json?.overview ?? {};
  t("overview → 200 with real numeric counts",
    overview.status === 200 && typeof ov.members === "number" && typeof ov.students === "number",
    `members=${ov.members} students=${ov.students} teachers=${ov.teachers} parents=${ov.parents}`);

  // ---- §15/§16: real parents ----
  // Ensure the demo parent is an ACTIVE ARC member (idempotent — skip if the
  // seed/probe already granted it). Exercises the member-grant path otherwise.
  const existingParentMembership = await prisma.organizationMembership.findFirst({
    where: { organizationId: ARC, userId: parentUser.id, status: "ACTIVE" },
  });
  if (!existingParentMembership) {
    const grant = await api("POST", `/api/organizations/${ARC}/members`, adminT, {
      userId: parentUser.id,
      role: "LEARNER",
    });
    t("grant parent ARC membership → 201", grant.status === 201, `status=${grant.status}`);
  } else {
    t("grant parent ARC membership → 201", true, "already active (idempotent skip)");
  }

  const parents = await api("GET", `/api/organizations/${ARC}/parents`, adminT);
  const parentList = parents.json?.parents ?? [];
  t("GET parents → 200 real parent-role members",
    parents.status === 200 && parentList.some((p) => p.email === "parent@aratc.edu.ph"),
    `count=${parentList.length}`);

  const parentDetail = await api("GET", `/api/organizations/${ARC}/parents/${parentUser.id}`, adminT);
  t("parent detail → 200 with linkedStudents array",
    parentDetail.status === 200 && Array.isArray(parentDetail.json?.parent?.linkedStudents),
    `status=${parentDetail.status}`);

  // ---- §17/§18: parent → student linking (org-scoped) ----
  const link = await api(
    "POST",
    `/api/organizations/${ARC}/parents/${parentUser.id}/students/${studentUser.id}`,
    adminT
  );
  t("link ARC parent → ARC student → 201", link.status === 201, `status=${link.status}`);

  const linkCross = await api(
    "POST",
    `/api/organizations/${ARC}/parents/${parentUser.id}/students/${externalUser.id}`,
    adminT
  );
  t("cross-tenant link (ARC parent → Sto.Niño user) DENIED",
    linkCross.status >= 400 && linkCross.status !== 201, `status=${linkCross.status}`);

  const linkByExternal = await api(
    "POST",
    `/api/organizations/${ARC}/parents/${parentUser.id}/students/${studentUser.id}`,
    externalT
  );
  t("external (non-ARC) admin link attempt → 403", linkByExternal.status === 403, `status=${linkByExternal.status}`);

  const unlink = await api(
    "DELETE",
    `/api/organizations/${ARC}/parents/${parentUser.id}/students/${studentUser.id}`,
    adminT
  );
  t("unlink → 200 (soft revoke)", unlink.status === 200, `status=${unlink.status}`);

  const parentAfter = await api("GET", `/api/organizations/${ARC}/parents/${parentUser.id}`, adminT);
  const stillLinked = (parentAfter.json?.parent?.linkedStudents ?? []).some(
    (s) => s.id === studentUser.id || s.userId === studentUser.id
  );
  t("parent detail reflects unlink", parentAfter.status === 200 && !stillLinked);

  // ---- §19/§20: organization settings (real data) ----
  const settingsGet = await api("GET", `/api/organizations/${ARC}/settings`, adminT);
  t("GET settings → 200 real profile",
    settingsGet.status === 200 && settingsGet.json?.settings?.name && settingsGet.json?.settings?.slug,
    `name=${settingsGet.json?.settings?.name}`);

  const stamp = `+63 917 ${String(Date.now()).slice(-7, -3)} ${String(Date.now()).slice(-3)}`;
  const settingsPatch = await api("PATCH", `/api/organizations/${ARC}/settings`, adminT, {
    contactEmail: "admin@aratc.edu.ph",
    contactPhone: stamp,
    address: "Session-based probe update (safe to edit)",
    description: "ARC Review Center — CS#23.3 probe",
  });
  t("PATCH settings → 200 reflects update",
    settingsPatch.status === 200 && settingsPatch.json?.settings?.contactPhone === stamp,
    `status=${settingsPatch.status}`);

  const settingsByStudent = await api("PATCH", `/api/organizations/${ARC}/settings`, studentT, {
    name: "Hacked Org",
  });
  t("student PATCH settings → 403", settingsByStudent.status === 403, `status=${settingsByStudent.status}`);

  // ---- §24/§25: create org user; platform roles rejected ----
  const newEmail = `probe.cs233.${Date.now()}@aratc.edu.ph`;
  const created = await api("POST", `/api/organizations/${ARC}/users`, adminT, {
    email: newEmail,
    password: "Test@1234",
    firstName: "Probe",
    lastName: "CS233",
    role: "student",
  });
  t("org admin creates org student → 201",
    created.status === 201 && created.json?.user?.role === "student", `status=${created.status}`);

  const createdLogin = created.status === 201
    ? await loginToken(newEmail)
    : null;
  t("created user can log in", !!createdLogin);

  const evilCreate = await api("POST", `/api/organizations/${ARC}/users`, adminT, {
    email: `probe.cs233.ev.${Date.now()}@aratc.edu.ph`,
    password: "Test@1234",
    firstName: "Evil",
    lastName: "Probe",
    role: "super_admin",
  });
  t("org admin cannot create super_admin (§25)",
    evilCreate.status >= 400, `status=${evilCreate.status}`);

  console.log(`\n${pass} pass, ${fail} fail`);
  await prisma.$disconnect();
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error("PROBE ERROR", e); process.exit(1); });

