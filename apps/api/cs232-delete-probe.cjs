/* CS#23.2 fix verification: superadmin DELETE /api/programs/:id on an
 * org-owned program previously 403'd ("You do not have access to content in
 * this organization"). Self-cleaning probe: creates a throwaway program in an
 * org as superadmin, deletes it both with and without the org header. */
const BASE = "http://localhost:4000";

async function api(method, url, token, body, orgId) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (orgId) headers["x-organization-id"] = orgId;
  const res = await fetch(BASE + url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* empty */ }
  return { status: res.status, json };
}

(async () => {
  const login = await api("POST", "/api/auth/login", null, {
    email: "demo.superadmin@aratc.edu.ph", password: "Test@1234",
  });
  const token = login.json?.token ?? login.json?.accessToken;
  if (login.status !== 200 || !token) {
    console.error("FATAL: superadmin login failed", login.status, login.json);
    process.exit(1);
  }
  const t = token;
  console.log("superadmin login OK");

  const orgs = await api("GET", "/api/organizations", t);
  const orgList = orgs.json?.organizations ?? orgs.json?.data ?? orgs.json ?? [];
  const org = orgList[0];
  if (!org?.id) { console.error("FATAL: no org found", orgs.status, orgs.json); process.exit(1); }
  console.log(`using org ${org.id} (${org.name || org.slug})`);

  const slug = "cs232-fix-probe-" + Date.now();
  const created = await api("POST", "/api/programs", t,
    { name: "CS232 Fix Probe", slug, stage: "COLLEGE" }, org.id);
  console.log(`create (with org header): ${created.status}`);
  if (created.status !== 201) { console.error(created.json); process.exit(1); }
  const pid = created.json?.data?.id || created.json?.id;

  const delWithHeader = await api("DELETE", `/api/programs/${pid}`, t, null, org.id);
  const okH = [200, 204].includes(delWithHeader.status);
  console.log(`delete (with org header):    ${delWithHeader.status} ${okH ? "PASS" : "FAIL " + JSON.stringify(delWithHeader.json)}`);

  // Recreate and delete WITHOUT the org header — the original failure mode.
  const slug2 = slug + "-b";
  const created2 = await api("POST", "/api/programs", t,
    { name: "CS232 Fix Probe B", slug: slug2, stage: "COLLEGE" }, org.id);
  console.log(`recreate (with org header): ${created2.status}`);
  const pid2 = created2.json?.data?.id || created2.json?.id;

  const delNoHeader = await api("DELETE", `/api/programs/${pid2}`, t);
  const okN = [200, 204].includes(delNoHeader.status);
  console.log(`delete (NO org header):      ${delNoHeader.status} ${okN ? "PASS" : "FAIL " + JSON.stringify(delNoHeader.json)}`);

  // Cleanup any leftovers.
  for (const id of [pid, pid2].filter(Boolean)) {
    const r = await api("DELETE", `/api/programs/${id}`, t);
    if (r.status === 200) console.log(`cleanup: deleted ${id}`);
  }

  const ok = okH && okN;
  console.log(ok ? "\nALL PROBES PASS ✔" : "\nPROBE FAILURE ✘");
  process.exit(ok ? 0 : 1);
})();
