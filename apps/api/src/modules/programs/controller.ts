import { Request, Response, NextFunction } from "express";
import { prisma } from "@aratc/database";
import { createProgramSchema } from "@aratc/shared";
import { validateRequest } from "../../lib/validate";
import { NotFoundError } from "../../lib/errors";
import { canViewUnpublishedContent } from "../../lib/visibility";
import { canReadContent } from "../../lib/tenant-scope";
import {
  listPrograms,
  getProgramById,
  getProgramBySlug,
  createProgram,
  updateProgram,
  publishProgram,
  submitProgramForReview,
  approveProgram,
  rejectProgram,
  deleteProgram,
  createProgramFromTemplate,
  createCetMockExams,
} from "./service";
import { AratcShsCurriculumTemplate } from "./templates";

export async function list(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Non-privileged callers only ever see published programs.
    const programs = await listPrograms(
      canViewUnpublishedContent(req) ? undefined : { status: "PUBLISHED" },
      req.organizationId
    );
    res.json(programs);
  } catch (error) {
    next(error);
  }
}

export async function getById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const program = await getProgramById(req.params.id, {
      includeUnpublished: canViewUnpublishedContent(req),
    });
    // §44 read scope: org-owned content is only visible to members of the
    // owning org (platform admins read everything). 404 — never 403 — so the
    // existence of other orgs' content is not revealed.
    if (!canReadContent(req.organizationId, req.userRoles, program.organizationId)) {
      throw new NotFoundError("Program not found");
    }
    res.json(program);
  } catch (error) {
    next(error);
  }
}

export async function getBySlug(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const program = await getProgramBySlug(req.params.slug);
    // Same read scope as by-id (§44) — org-owned content stays in its org.
    if (!canReadContent(req.organizationId, req.userRoles, program.organizationId)) {
      throw new NotFoundError("Program not found");
    }
    res.json(program);
  } catch (error) {
    next(error);
  }
}

export async function create(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = validateRequest(createProgramSchema, req.body);
    const program = await createProgram(input, {
      organizationId: req.organizationId,
      userId: req.userId,
    });
    res.status(201).json(program);
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = validateRequest(createProgramSchema.partial(), req.body);
    const program = await updateProgram(req.params.id, input, {
      organizationId: req.organizationId,
      roles: req.userRoles,
    });
    res.json(program);
  } catch (error) {
    next(error);
  }
}

export async function publish(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const program = await publishProgram(req.params.id, {
      organizationId: req.organizationId,
      roles: req.userRoles,
    });
    res.json(program);
  } catch (error) {
    next(error);
  }
}

// ============================================================
// Approval workflow (CS#6 — §17)
// ============================================================

export async function submitReview(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const program = await submitProgramForReview(req.params.id, {
      organizationId: req.organizationId,
      roles: req.userRoles,
    });
    res.json(program);
  } catch (error) {
    next(error);
  }
}

export async function approve(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const program = await approveProgram(req.params.id, {
      organizationId: req.organizationId,
      roles: req.userRoles,
    });
    res.json(program);
  } catch (error) {
    next(error);
  }
}

export async function reject(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const program = await rejectProgram(req.params.id, {
      organizationId: req.organizationId,
      roles: req.userRoles,
    });
    res.json(program);
  } catch (error) {
    next(error);
  }
}

export async function remove(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await deleteProgram(req.params.id, {
      organizationId: req.organizationId,
      roles: req.userRoles,
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

// ============================================================
// Template-based creation
// ============================================================

export async function createFromTemplate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // authenticate() guarantees userId on role-guarded routes
    const authorId = req.userId!;
    const result = await createProgramFromTemplate(AratcShsCurriculumTemplate, authorId);

    res.status(201).json({
      message: "Program created from template",
      programId: result.programId,
      programName: result.programName,
      curriculaCount: result.curriculaCount,
    });
  } catch (error) {
    next(error);
  }
}

export async function generateCetExams(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const programId = req.params.id;

    // Build topic slug -> ID map from the program's curriculums
    const topicMap = await buildTopicMap(programId);

    const result = await createCetMockExams(
      programId,
      AratcShsCurriculumTemplate.cetExams,
      topicMap
    );

    res.status(201).json({
      message: "CET mock exams created",
      count: result.length,
      exams: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Helper: collect all topic slugs and IDs under a program's curriculums.
 */
async function buildTopicMap(programId: string): Promise<Map<string, string>> {
  const topics = await prisma.topic.findMany({
    where: {
      module: {
        subject: {
          curriculumItems: {
            some: {
              curriculum: {
                programId,
              },
            },
          },
        },
      },
    },
    select: {
      id: true,
      slug: true,
    },
  });

  const map = new Map<string, string>();
  for (const t of topics) {
    map.set(t.slug, t.id);
  }
  return map;
}
