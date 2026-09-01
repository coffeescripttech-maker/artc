const { PrismaClient } = require('@aratc/database');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const SECRET = 'default-jwt-secret-change-in-production';

(async () => {
  // Check program
  const program = await prisma.program.findUnique({
    where: { id: 'cmtfhtyiq000111amw03ho6k1' },
    select: { id: true, name: true, status: true, organizationId: true },
  });
  console.log('Program:', JSON.stringify(program));

  // Check organizations
  const orgs = await prisma.organization.findMany({
    select: { id: true, name: true, slug: true, status: true },
  });
  console.log('Organizations:', JSON.stringify(orgs));

  // Check the superadmin user
  const user = await prisma.user.findUnique({
    where: { email: 'demo.superadmin@aratc.edu.ph' },
    include: { roles: { include: { role: true } } },
  });
  console.log('Superadmin user:', JSON.stringify(user));

  // Use the real token
  const token = jwt.sign(
    { userId: user?.id || 'test', roles: user?.roles?.map(ur => ur.role.name) || ['super_admin'] },
    SECRET,
    { expiresIn: '1h' }
  );

  // Probe without org header
  const res1 = await fetch('http://localhost:4000/api/programs/by-id/cmtfhtyiq000111amw03ho6k1', {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('No-org-header:', res1.status, await res1.text());

  // Probe with org header (try a few org IDs)
  for (const orgId of ['org-arc-demo', 'org-sto-nino', orgs[0]?.id, program?.organizationId]) {
    if (!orgId) continue;
    const res = await fetch('http://localhost:4000/api/programs/by-id/cmtfhtyiq000111amw03ho6k1', {
      headers: { Authorization: `Bearer ${token}`, 'x-organization-id': orgId },
    });
    console.log(`With-org-header (${orgId}):`, res.status, await res.text());
  }

  await prisma.$disconnect();
})();