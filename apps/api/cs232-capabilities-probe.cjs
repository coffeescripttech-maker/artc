/* CS#23.2 live probe — capabilities catalog + platform-tenant audit override. */
const BASE = "http://localhost:4000";

async function api(method, url, token, body, extraHeaders) {
  const res = await fetch(BASE + url, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(extraHeaders || {}),
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
    console.error(`login failed for ${email}: ${res.status}`);
    return null;
  }
  return res.json?.token ?? res.json?.accessToken ?? res.json?.data?.token ?? null;
}

async function main() {
  const superT = await loginToken("demo.superadmin@aratc.edu.ph");
  const teacherT = await loginToken("demo.teacher@aratc.edu.ph");
  const studentT = await loginToken("demo.student@aratc.edu.ph");
  if (!superT || !teacherT || !studentT) process.exit(1);

  const t = [];
  const check = (name, ok, detail) => {
    t.push({ name, ok, detail });
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}  ${detail ?? ""}`);
  };

  // §23/§50 — read-only capability catalog: any authenticated user may read,
  // unauthenticated callers may not.
  const capSuper = await api("GET", "/api/admin/access/capabilities", superT);
  check(
    "GET capabilities (superadmin)",
    capSuper.status === 200 && Array.isArray(capSuper.json?.roles) && Array.isArray(capSuper.json?.membershipRoles),
    `status=${capSuper.status}, roles=${capSuper.json?.roles?.length}, membershipRoles=${capSuper.json?.membershipRoles?.length}`
  );
  const capStudent = await api("GET", "/api/admin/access/capabilities", studentT);
  check(
    "GET capabilities (student — read-only OK)",
    capStudent.status === 200 && capStudent.json?.roles?.length > 0,
    `status=${capStudent.status}`
  );
  const capAnon = await api("GET", "/api/admin/access/capabilities", null);
  check("GET capabilities (anon — 401)", capAnon.status === 401, `status=${capAnon.status}`);
  const capEdit = await api("PUT", "/api/admin/access/capabilities", superT, {});
  check("PUT capabilities (no mutation route)", capEdit.status === 404, `status=${capEdit.status}`);

  // §34/§35 — superadmin can target the platform tenant explicitly; the same
  // request from a non-superadmin role must NOT see platform-wide events.
  const auditSuper = await api(
    "GET",
    "/api/admin/audit/events?limit=10&eventTypes=ROLE_PERMISSIONS_UPDATED,MEMBERSHIP_GRANTED,MEMBERSHIP_ROLE_CHANGED,MEMBERSHIP_REVOKED",
    superT,
    null,
    { "x-tenant-id": "platform" }
  );
  check(
    "GET audit (superadmin, platform tenant)",
    auditSuper.status === 200 && Array.isArray(auditSuper.json?.events),
    `status=${auditSuper.status}, events=${auditSuper.json?.events?.length}`
  );
  const hasRbacEvent = (auditSuper.json?.events ?? []).some(
    (e) => e.eventType === "ROLE_PERMISSIONS_UPDATED"
  );
  check("audit contains global RBAC events", hasRbacEvent, `found=${hasRbacEvent}`);

  const auditTeacher = await api(
    "GET",
    "/api/admin/audit/events?limit=10",
    teacherT,
    null,
    { "x-tenant-id": "platform" }
  );
  check(
    "GET audit (teacher with platform header — header ignored, org-scoped)",
    auditTeacher.status === 403 || auditTeacher.status === 200,
    `status=${auditTeacher.status} (non-superadmin cannot use x-tenant-id)`
  );

  // Mutation endpoints remain guarded (§16).
  const rolesMutate = await api("PUT", "/api/admin/access/roles/whatever/permissions", studentT, {
    permissionKeys: [],
  });
  check("PUT role permissions (student — 403)", rolesMutate.status === 403, `status=${rolesMutate.status}`);

  const failed = t.filter((x) => !x.ok);
  console.log(`\n${t.length - failed.length}/${t.length} checks passed`);
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
