/* CS#23.2 role inventory — discover the complete role universe from the DB. */
const { prisma } = require("@aratc/database");

async function main() {
  const roles = await prisma.role.findMany({
    select: {
      id: true,
      name: true,
      displayName: true,
      description: true,
      _count: { select: { users: true } },
    },
    orderBy: { name: "asc" },
  });
  console.log("ROLES:", JSON.stringify(roles, null, 2));

  const memberships = await prisma.organizationMembership.groupBy({
    by: ["role"],
    _count: { role: true },
  });
  console.log("MEMBERSHIP_ROLES:", JSON.stringify(memberships));

  const usersWithRoles = await prisma.userRole.groupBy({
    by: ["roleId"],
    _count: { roleId: true },
  });
  console.log("USERROLE_COUNTS:", JSON.stringify(usersWithRoles));

  const totalUsers = await prisma.user.count();
  const usersNoRoles = await prisma.user.count({ where: { roles: { none: {} } } });
  console.log("TOTAL_USERS:", totalUsers, "USERS_WITHOUT_ROLES:", usersNoRoles);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
