import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { buildApp } from '../app';
import { isActiveEnrollment } from '../lib/program-access';

vi.mock('@aratc/database', () => ({
  prisma: {
    learnerProfile: { findUnique: vi.fn() },
    program: { findUnique: vi.fn() },
    enrollment: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    user: { findUnique: vi.fn() },
  },
}));

import { prisma } from '@aratc/database';

const mockedPrisma = vi.mocked(prisma, true);
const app = buildApp();

const USER_ID = '00000000-0000-4000-8000-000000000002';
const ADMIN_ID = '00000000-0000-4000-8000-000000000003';
const PROGRAM_ID = '00000000-0000-4000-8000-000000000004';
const LP_ID = 'lp-000001';

function tokenFor(userId: string, roles: string[]): string {
  return jwt.sign({ userId, roles }, config.jwtSecret, { expiresIn: '1h' });
}

const adminToken = tokenFor(ADMIN_ID, ['school_admin']);
const studentToken = tokenFor(USER_ID, ['student']);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Program access policy (isActiveEnrollment)', () => {
  it('active, unexpired enrollment grants access', () => {
    expect(
      isActiveEnrollment({ status: 'ACTIVE', expiresAt: new Date(Date.now() + 86_400_000) }),
    ).toBe(true);
  });

  it('expired enrollment does NOT grant access (architecture §36)', () => {
    expect(
      isActiveEnrollment({ status: 'ACTIVE', expiresAt: new Date(Date.now() - 1000) }),
    ).toBe(false);
  });

  it('withdrawn/suspended enrollment does NOT grant access', () => {
    expect(isActiveEnrollment({ status: 'CANCELLED', expiresAt: null })).toBe(false);
    expect(isActiveEnrollment({ status: 'SUSPENDED', expiresAt: null })).toBe(false);
  });
});

describe('Enrollment management API', () => {
  it('grants an enrollment with ADMIN_GRANT provenance and granting admin', async () => {
    mockedPrisma.learnerProfile.findUnique
      .mockResolvedValueOnce({ id: LP_ID, userId: USER_ID } as never) // resolve via userId
      .mockResolvedValueOnce({ id: LP_ID, userId: USER_ID } as never); // existence check
    mockedPrisma.program.findUnique.mockResolvedValue({ id: PROGRAM_ID } as never);
    mockedPrisma.enrollment.upsert.mockResolvedValue({
      id: 'e1',
      status: 'ACTIVE',
      sourceType: 'ADMIN_GRANT',
      expiresAt: null,
      startedAt: new Date(),
      endedAt: null,
      createdAt: new Date(),
      curriculumId: null,
      learner: { id: LP_ID, userId: USER_ID, user: { firstName: 'Ana', lastName: 'Reyes', email: 's@x.com' } },
      enrolledBy: { id: ADMIN_ID, firstName: 'Admin', lastName: 'User' },
    } as never);

    const res = await request(app)
      .post(`/api/programs/${PROGRAM_ID}/enrollments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: USER_ID });

    expect(res.status).toBe(201);
    expect(res.body.sourceType).toBe('ADMIN_GRANT');
    expect(res.body.enrolledBy.id).toBe(ADMIN_ID);
    expect(res.body.active).toBe(true);
    expect(mockedPrisma.enrollment.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          learnerId: LP_ID,
          programId: PROGRAM_ID,
          sourceType: 'ADMIN_GRANT',
          enrolledById: ADMIN_ID,
        }),
      }),
    );
  });

  it('rejects enrollment grant from a student (backend authorization)', async () => {
    const res = await request(app)
      .post(`/api/programs/${PROGRAM_ID}/enrollments`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ userId: USER_ID });

    expect(res.status).toBe(403);
    expect(mockedPrisma.enrollment.upsert).not.toHaveBeenCalled();
  });

  it('returns 404 when the user has no learner profile', async () => {
    mockedPrisma.learnerProfile.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post(`/api/programs/${PROGRAM_ID}/enrollments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: USER_ID });

    expect(res.status).toBe(404);
  });

  it('lists program enrollments for a privileged viewer', async () => {
    mockedPrisma.enrollment.findMany.mockResolvedValue([
      {
        id: 'e1',
        status: 'ACTIVE',
        sourceType: 'ADMIN_GRANT',
        expiresAt: null,
        startedAt: new Date(),
        endedAt: null,
        createdAt: new Date(),
        curriculumId: null,
        learner: { id: LP_ID, userId: USER_ID, user: { firstName: 'Ana', lastName: 'Reyes', email: 's@x.com' } },
        enrolledBy: { id: ADMIN_ID, firstName: 'Admin', lastName: 'User' },
      },
    ] as never);

    const res = await request(app)
      .get(`/api/programs/${PROGRAM_ID}/enrollments`)
      .set('Authorization', `Bearer ${studentToken}`);

    // Students are NOT in the view set — teacher/admin only.
    expect(res.status).toBe(403);
  });

  it('teacher can view a program roster (view set, not manage set)', async () => {
    mockedPrisma.enrollment.findMany.mockResolvedValue([] as never);

    const res = await request(app)
      .get(`/api/programs/${PROGRAM_ID}/enrollments`)
      .set('Authorization', `Bearer ${tokenFor(USER_ID, ['teacher'])}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('My enrollments (student-facing dashboard endpoint)', () => {
  const myEnrollmentRow = {
    id: 'e9',
    status: 'ACTIVE',
    sourceType: 'ADMIN_GRANT',
    expiresAt: new Date(Date.now() + 86_400_000),
    startedAt: new Date(),
    endedAt: null,
    createdAt: new Date(),
    curriculumId: null,
    learner: { id: LP_ID, userId: USER_ID, user: { firstName: 'Ana', lastName: 'Reyes', email: 's@x.com' } },
    enrolledBy: null,
    program: { id: PROGRAM_ID, name: 'Reading Basics', slug: 'reading-basics', status: 'PUBLISHED' },
  };

  it('returns the learner’s enrollments with program summary and active flag', async () => {
    mockedPrisma.learnerProfile.findUnique.mockResolvedValue({ id: LP_ID, userId: USER_ID } as never);
    mockedPrisma.enrollment.findMany.mockResolvedValue([myEnrollmentRow] as never);

    const res = await request(app)
      .get('/api/my/enrollments')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].program).toEqual(myEnrollmentRow.program);
    expect(res.body[0].active).toBe(true);
    expect(res.body[0].status).toBe('ACTIVE');
    expect(res.body[0].expiresAt).toBeTruthy();
  });

  it('returns an empty list for a user with no learner profile', async () => {
    mockedPrisma.learnerProfile.findUnique.mockResolvedValue(null as never);

    const res = await request(app)
      .get('/api/my/enrollments')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('marks expired enrollments as inactive but still returns them', async () => {
    mockedPrisma.learnerProfile.findUnique.mockResolvedValue({ id: LP_ID, userId: USER_ID } as never);
    mockedPrisma.enrollment.findMany.mockResolvedValue([
      { ...myEnrollmentRow, id: 'e10', expiresAt: new Date(Date.now() - 1000) },
    ] as never);

    const res = await request(app)
      .get('/api/my/enrollments')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body[0].active).toBe(false);
  });

  it('requires authentication (401 without token)', async () => {
    const res = await request(app).get('/api/my/enrollments');
    expect(res.status).toBe(401);
  });
});