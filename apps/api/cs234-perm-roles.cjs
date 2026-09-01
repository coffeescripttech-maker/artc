const { prisma } = require('@aratc/database');
(async () => {
  const keys = ['programs.create','programs.update','programs.publish','programs.archive','lessons.create','lessons.update','lessons.publish','lessons.archive','lessons.delete','programs.delete'];
  const perms = await prisma.permission.findMany({
    where: { key: { in: keys } },
    select: { key: true, roles: { select: { role: { select: { name: true } } } } },
  });
  for (const p of perms) console.log(p.key, '->', p.roles.map((r) => r.role.name).join(',') || '(none)');
  await prisma.$disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
