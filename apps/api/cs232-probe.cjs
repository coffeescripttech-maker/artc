/* CS#23.2 live probe — validates RBAC end-to-end against the running API. */
const BASE = "http://localhost:4000";

const DEMO_EMAILS = [
  "demo.superadmin@aratc.edu.ph",
  "demo.teacher@aratc.edu.ph",
  "demo.student@aratc.edu.ph",
];

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

async function main() {
  const { prisma } = require("@aratc/database");

  const superT = await loginToken(DEMO_EMAILS[0]);
  const teacherT = await loginToken(DEMO_EMAILS[1]);
  const studentT = await loginToken(DEMO_EMAILS[2]);
  console.log("tokens:", { super: !!superT, teacher: !!teacherT, student: !!studentT });
  if (!superT || !teacherT || !studentT) process.exit(1);

  const results = [];
  const t = (name, ok, extra) => results.push(`${ok ? "PASS" : "FAIL"} ${name}${extra ? " — " + extra : ""}`);

  // CS#23.1 regression — superadmin public read without org header.
  const prog = await prisma.program.findFirst({ select: { id: true } });
  const r1 = await api("GET", `/api/programs/by-id/${prog.id}`, superT);
  t("CS#23.1 superadmin program by-id (no org header)", r1.status === 200, `status=${r1.status}`);

  // Access control reads (superadmin).
  const r2 = await api("GET", "/api/admin/access/roles", superT);
  t("GET /admin/access/roles (superadmin)", r2.status === 200 && Array.isArray(r2.json?.roles), `status=${r2.status}, roles=${r2.json?.roles?.length}`);
  const r3 = await api("GET", "/api/admin/access/permissions", superT);
  t("GET /admin/access/permissions", r3.status === 200 && r3.json?.permissions?.length === 77, `status=${r3.status}, perms=${r3.json?.permissions?.length}`);

  // Access control FORBIDDEN for teacher (no platform.orgs_manage).
  const r4 = await api("GET", "/api/admin/access/roles", teacherT);
  t("GET /admin/access/roles (teacher) → 403", r4.status === 403, `status=${r4.status}`);

  // Permission write + revert on teacher role (validates PUT + audit + cache).
  const teacherRole = r2.json?.roles?.find((r) => r.name === "teacher");
  const origKeys = (await api("GET", `/api/admin/access/roles/${teacherRole.id}`, superT)).json?.role?.permissionKeys;
  const modified = [...new Set([...(origKeys || []), "media.upload"])];
  const r5 = await api("PUT", `/api/admin/access/roles/${teacherRole.id}/permissions`, superT, { permissionKeys: modified });
  t("PUT role permissions (add media.upload)", r5.status === 200, `status=${r5.status}`);
  const r6 = await api("PUT", `/api/admin/access/roles/${teacherRole.id}/permissions`, superT, { permissionKeys: origKeys });
  t("PUT role permissions (revert)", r6.status === 200, `status=${r6.status}`);

  // System-locked refusal.
  const superRole = r2.json?.roles?.find((r) => r.name === "super_admin");
  const r7 = await api("PUT", `/api/admin/access/roles/${superRole.id}/permissions`, superT, { permissionKeys: [] });
  t("PUT super_admin permissions → 403 (system-locked)", r7.status === 403, `status=${r7.status}`);

  // Simulator.
  const r8 = await api("POST", "/api/admin/access/simulate", superT, { roleName: "teacher", membershipRole: "TEACHER" });
  t("POST simulate (teacher + org TEACHER)", r8.status === 200 && r8.json?.granted?.includes("batches.manage"), `status=${r8.status}, granted=${r8.json?.granted?.length}`);

  // Permission-gated route behavior with real role tokens.
  // NOTE: /api/batches/* is not currently mounted in app.ts (pre-existing gap),
  // so enforcement is verified against mounted routes instead.
  const r9 = await api("POST", "/api/questions/import/bulk", teacherT, {});
  if (r9.status !== 400) console.log("r9 body:", JSON.stringify(r9.json).slice(0, 300));
  t("POST /questions/import/bulk (teacher — has questions.import → past guard)", r9.status === 400, `status=${r9.status}`);
  const r10 = await api("POST", "/api/questions/import/bulk", studentT, {});
  t("POST /questions/import/bulk (student — lacks questions.import) → 403", r10.status === 403, `status=${r10.status}`);
  const r10b = await api("GET", "/api/settings/general", studentT);
  t("GET /settings/general (student — lacks settings.read) → 403", r10b.status === 403, `status=${r10b.status}`);

  // Audit event written for the permission update.
  const audit = await prisma.auditEvent.findFirst({
    where: { eventType: "ROLE_PERMISSIONS_UPDATED" },
    orderBy: { createdAt: "desc" },
  });
  t("ROLE_PERMISSIONS_UPDATED audit event written", !!audit, audit ? `actedOn=${audit.actedOn}` : "none");

  console.log(results.join("\n"));
  const failed = results.filter((r) => r.startsWith("FAIL")).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
