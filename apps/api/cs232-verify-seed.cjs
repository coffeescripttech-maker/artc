const { prisma } = require("@aratc/database");

async function main() {
  const pc = await prisma.permission.count();
  const rc = await prisma.rolePermission.count();
  console.log("PERMISSIONS:", pc, "ROLE_PERMISSIONS:", rc);
  const roles = await prisma.role.findMany({
    select: { name: true, _count: { select: { permissions: true } } },
    orderBy: { name: "asc" },
  });
  for (const r of roles) console.log(`  ${r.name}: ${r._count.permissions}`);
}

main()
  .catch((e) => {
    console.error("ERR", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
