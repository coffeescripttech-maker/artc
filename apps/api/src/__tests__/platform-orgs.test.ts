import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { buildApp } from '../app';

vi.mock('@aratc/database', () => ({
  prisma: {
    organization: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    user: { findUnique: vi.fn() },
    organizationMembership: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import { prisma } from '@aratc/database';
import type { Organization, User, OrganizationMembership } from '@aratc/database';

const mockedPrisma = vi.mocked(prisma, true);
const app = buildApp();

const ORG_ID = '00000000-0000-4000-8000-000000000001';
const USER_ID = '00000000-0000-4000-8000-000000000002';
const OTHER_ID = '00000000-0000-4000-8000-000000000003';
const MISSING_ID = '00000000-0000-4000-8000-000000000004';

function tokenFor(userId: string, roles: string[]): string {
  return jwt.sign({ userId, roles }, config.jwtSecret, { expiresIn: '1h' });
}

const baseOrg = {
  id: ORG_ID,
  name: 'Demo Org',
  slug: 'demo-org',
  status: 'PUBLISHED',
  metadata: {},
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Superadmin Platform Organizations', () => {
  // ── 1. Non-superadmin denied ──
  it('returns 403 for non-superadmin on GET /api/platform/organizations', async () => {
    const token = tokenFor(USER_ID, ['school_admin']);
    const res = await request(app)
      .get('/api/platform/organizations')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('returns 403 for unauthenticated request', async () => {
    const res = await request(app).get('/api/platform/organizations');
    expect(res.status).toBe(401);
  });

  // ── 2. List ──
  it('superadmin can list organizations', async () => {
    mockedPrisma.organization.findMany.mockResolvedValue([
      { ...baseOrg, _count: { memberships: 2, programs: 3, lessons: 10 } },
    ] as unknown as Organization[]);

    const token = tokenFor(USER_ID, ['super_admin']);
    const res = await request(app)
      .get('/api/platform/organizations')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body[0].id).toBe(ORG_ID);
    expect(res.body[0].memberCount).toBe(2);
    expect(res.body[0].reviewMode).toBe(false);
  });

  // ── 3. Create ──
  it('superadmin can create an organization', async () => {
    mockedPrisma.organization.findUnique.mockResolvedValue(null);
    mockedPrisma.organization.create.mockResolvedValue({
      id: ORG_ID,
      name: 'Demo Org',
      slug: 'demo-org',
    } as Organization);

    const token = tokenFor(USER_ID, ['super_admin']);
    const res = await request(app)
      .post('/api/platform/organizations')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Demo Org', slug: 'demo-org' });

    expect(res.status).toBe(201);
    expect(res.body.slug).toBe('demo-org');
    expect(mockedPrisma.organization.create).toHaveBeenCalledWith({
      data: { name: 'Demo Org', slug: 'demo-org', metadata: {} },
    });
  });

  // ── 4. Update settings ──
  it('superadmin can toggle review mode via settings update', async () => {
    mockedPrisma.organization.update.mockResolvedValue({
      id: ORG_ID,
      name: 'Demo Org',
      slug: 'demo-org',
      metadata: { teacher_auto_publish: false },
    } as unknown as Organization);

    const token = tokenFor(USER_ID, ['super_admin']);
    const res = await request(app)
      .patch(`/api/platform/organizations/${ORG_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ settings: { teacher_auto_publish: false } });

    expect(res.status).toBe(200);
    expect(mockedPrisma.organization.update).toHaveBeenCalledWith({
      where: { id: ORG_ID },
      data: { metadata: { teacher_auto_publish: false } },
    });
  });

  // ── 5. Suspend ──
  it('superadmin can suspend an organization (maps to ARCHIVED)', async () => {
    mockedPrisma.organization.update.mockResolvedValue({
      ...baseOrg,
      status: 'ARCHIVED',
    } as unknown as Organization);
    const token = tokenFor(USER_ID, ['super_admin']);
    const res = await request(app)
      .patch(`/api/platform/organizations/${ORG_ID}/suspend`)
      .set('Authorization', `Bearer ${token}`)
      .send({ action: 'SUSPEND' });

    expect(res.status).toBe(200);
    expect(res.body.suspended).toBe(true);
    expect(mockedPrisma.organization.update).toHaveBeenCalledWith({
      where: { id: ORG_ID },
      data: { status: 'ARCHIVED' },
    });
  });

  // ── 6. Invite admin ──
  it('superadmin can invite an existing user as organization admin', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ id: OTHER_ID, email: 'newadmin@demo.com' } as User);
    mockedPrisma.organizationMembership.upsert.mockResolvedValue({
      id: 'om_1',
      organizationId: ORG_ID,
      userId: OTHER_ID,
      role: 'ADMIN',
      status: 'ACTIVE',
    } as OrganizationMembership);

    const token = tokenFor(USER_ID, ['super_admin']);
    const res = await request(app)
      .post(`/api/platform/organizations/${ORG_ID}/admins`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: OTHER_ID });

    expect(res.status).toBe(201);
    expect(res.body.role).toBe('ADMIN');
    expect(res.body.status).toBe('ACTIVE');
    expect(mockedPrisma.organizationMembership.upsert).toHaveBeenCalledWith({
      where: { organizationId_userId: { organizationId: ORG_ID, userId: OTHER_ID } },
      create: {
        organizationId: ORG_ID,
        userId: OTHER_ID,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
      update: { role: 'ADMIN', status: 'ACTIVE' },
    });
  });

  // ── 7. Invite admin — target not found ──
  it('returns 404 when inviting a non-existent user', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);
    const token = tokenFor(USER_ID, ['super_admin']);
    const res = await request(app)
      .post(`/api/platform/organizations/${ORG_ID}/admins`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: MISSING_ID });

    expect(res.status).toBe(404);
  });

  // ── 8. Create with image ──
  it('create stores imageUrl in metadata', async () => {
    mockedPrisma.organization.findUnique.mockResolvedValue(null);
    mockedPrisma.organization.create.mockResolvedValue({
      id: ORG_ID,
      name: 'Demo Org',
      slug: 'demo-org',
    } as unknown as Organization);

    const token = tokenFor(USER_ID, ['super_admin']);
    const res = await request(app)
      .post('/api/platform/organizations')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Demo Org', slug: 'demo-org', imageUrl: 'https://x/y.png' });

    expect(res.status).toBe(201);
    expect(mockedPrisma.organization.create).toHaveBeenCalledWith({
      data: {
        name: 'Demo Org',
        slug: 'demo-org',
        metadata: { imageUrl: 'https://x/y.png' },
      },
    });
  });

  // ── 9. Update merges metadata (preserves teacher_auto_publish) + imageUrl ──
  it('update merges imageUrl without clobbering existing metadata', async () => {
    mockedPrisma.organization.findUnique.mockResolvedValue({
      id: ORG_ID,
      metadata: { teacher_auto_publish: false },
    } as unknown as Organization);
    mockedPrisma.organization.update.mockResolvedValue({
      id: ORG_ID,
      name: 'Demo Org',
      slug: 'demo-org',
      metadata: { teacher_auto_publish: false, imageUrl: 'https://x/z.png' },
    } as unknown as Organization);

    const token = tokenFor(USER_ID, ['super_admin']);
    const res = await request(app)
      .patch(`/api/platform/organizations/${ORG_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ imageUrl: 'https://x/z.png' });

    expect(res.status).toBe(200);
    expect(mockedPrisma.organization.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            teacher_auto_publish: false,
            imageUrl: 'https://x/z.png',
          }),
        }),
      }),
    );
  });

  // ── 10. Delete — soft-delete with deletedAt marker ──
  it('delete stamps deletedAt and archives the organization', async () => {
    mockedPrisma.organization.findUnique.mockResolvedValue({
      id: ORG_ID,
      metadata: { teacher_auto_publish: false },
    } as unknown as Organization);
    mockedPrisma.organization.update.mockResolvedValue({
      ...baseOrg,
      status: 'ARCHIVED',
    } as unknown as Organization);

    const token = tokenFor(USER_ID, ['super_admin']);
    const res = await request(app)
      .delete(`/api/platform/organizations/${ORG_ID}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
    expect(mockedPrisma.organization.update).toHaveBeenCalledWith({
      where: { id: ORG_ID },
      data: expect.objectContaining({
        status: 'ARCHIVED',
        metadata: expect.objectContaining({
          teacher_auto_publish: false,
          deletedAt: expect.any(String),
        }),
      }),
    });
  });

  // ── 10b. Deleted orgs are hidden from the list by default ──
  it('list excludes deleted orgs by default but shows them with include_deleted=true', async () => {
    mockedPrisma.organization.findMany.mockResolvedValue([
      { ...baseOrg, _count: { memberships: 1, programs: 0, lessons: 0 } },
      {
        ...baseOrg,
        id: OTHER_ID,
        name: 'Deleted Org',
        status: 'ARCHIVED',
        metadata: { deletedAt: '2026-08-28T00:00:00.000Z' },
        _count: { memberships: 1, programs: 0, lessons: 0 },
      },
    ] as unknown as Organization[]);

    const token = tokenFor(USER_ID, ['super_admin']);

    const res = await request(app)
      .get('/api/platform/organizations')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Demo Org');

    const res2 = await request(app)
      .get('/api/platform/organizations?include_deleted=true')
      .set('Authorization', `Bearer ${token}`);
    expect(res2.status).toBe(200);
    expect(res2.body).toHaveLength(2);
    expect(res2.body[1].deleted).toBe(true);
  });

  // ── 10c. Activate restores a deleted org (clears deletedAt) ──
  it('activate restores a deleted organization by clearing deletedAt', async () => {
    mockedPrisma.organization.findUnique.mockResolvedValue({
      id: ORG_ID,
      metadata: { deletedAt: '2026-08-28T00:00:00.000Z' },
    } as unknown as Organization);
    mockedPrisma.organization.update.mockResolvedValue({
      ...baseOrg,
      status: 'PUBLISHED',
    } as unknown as Organization);

    const token = tokenFor(USER_ID, ['super_admin']);
    const res = await request(app)
      .patch(`/api/platform/organizations/${ORG_ID}/suspend`)
      .set('Authorization', `Bearer ${token}`)
      .send({ action: 'ACTIVATE' });

    expect(res.status).toBe(200);
    expect(mockedPrisma.organization.update).toHaveBeenCalledWith({
      where: { id: ORG_ID },
      data: expect.objectContaining({
        status: 'PUBLISHED',
        metadata: {},
      }),
    });
  });

  // ── 11. List exposes imageUrl + programCount ──
  it('list returns imageUrl and programCount', async () => {
    mockedPrisma.organization.findMany.mockResolvedValue([
      {
        ...baseOrg,
        metadata: { imageUrl: 'https://x/a.png' },
        _count: { memberships: 2, programs: 4, lessons: 0 },
      },
    ] as unknown as Organization[]);

    const token = tokenFor(USER_ID, ['super_admin']);
    const res = await request(app)
      .get('/api/platform/organizations')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body[0].imageUrl).toBe('https://x/a.png');
    expect(res.body[0].programCount).toBe(4);
  });
});

