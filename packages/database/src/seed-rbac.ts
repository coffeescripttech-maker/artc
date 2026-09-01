// CS#23.2 — RBAC seed: upserts the permission catalog and assigns default
// grants per role. Idempotent:
//   default mode → adds any MISSING catalog permissions + MISSING default
//                  grants (never removes superadmin customizations);
//   --reset      → wipes role_permissions and re-applies code defaults.
//
// Usage: npm run db:seed-rbac [-- --reset]   (from packages/database)

import { prisma } from "./index";
import { PERMISSION_CATALOG, DEFAULT_ROLE_PERMISSIONS } from "./permission-catalog";

async function main() {
  const reset = process.argv.includes("--reset");

  // 1. Upsert permissions from the catalog (additive; display metadata refresh).
  for (const def of PERMISSION_CATALOG) {
    await prisma.permission.upsert({
      where: { key: def.key },
      create: {
        key: def.key,
        resource: def.resource,
        action: def.action,
        displayName: def.displayName,
        description: def.description,
        isEnforced: def.enforced,
      },
      update: {
        resource: def.resource,
        action: def.action,
        displayName: def.displayName,
        description: def.description,
        isEnforced: def.enforced,
      },
    });
  }
  console.log(`permissions upserted: ${PERMISSION_CATALOG.length}`);

  if (reset) {
    const deleted = await prisma.rolePermission.deleteMany({});
    console.log(`role_permissions cleared: ${deleted.count}`);
  }

  // 2. Apply default grants for any (role, permission) pair not yet granted.
  const permissions = await prisma.permission.findMany({ select: { id: true, key: true } });
  const permByKey = new Map(permissions.map((p) => [p.key, p.id]));
  const roles = await prisma.role.findMany({ select: { id: true, name: true } });
  const roleByName = new Map(roles.map((r) => [r.name, r.id]));

  let added = 0;
  for (const [roleName, keys] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    const roleId = roleByName.get(roleName);
    if (!roleId) {
      console.warn(`role "${roleName}" not found in DB — skipping`);
      continue;
    }
    const existing = await prisma.rolePermission.findMany({
      where: { roleId },
      select: { permissionId: true },
    });
    const have = new Set(existing.map((e) => e.permissionId));
    for (const key of keys) {
      const permissionId = permByKey.get(key);
      if (!permissionId) {
        console.warn(`permission "${key}" missing from DB — skipping`);
        continue;
      }
      if (have.has(permissionId)) continue;
      await prisma.rolePermission.create({ data: { roleId, permissionId } });
      added++;
    }
  }
  console.log(`default grants applied: ${added} new`);

  // 3. Summary per role.
  const summary = await prisma.role.findMany({
    select: { name: true, _count: { select: { permissions: true } } },
    orderBy: { name: "asc" },
  });
  for (const s of summary) console.log(`  ${s.name}: ${s._count.permissions} permissions`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
