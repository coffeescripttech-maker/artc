import { Request, Response, NextFunction } from "express";
import { prisma } from "@aratc/database";
import { createProgramSchema } from "@aratc/shared";
import { validateRequest } from "../../lib/validate";
import {
  listPrograms,
  getProgramBySlug,
  createProgram,
  updateProgram,
  publishProgram,
  deleteProgram,
  createProgramFromTemplate,
  createCetMockExams,
} from "./service";
import { AratcShsCurriculumTemplate } from "./templates";

export async function list(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const programs = await listPrograms();
    res.json(programs);
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
    const program = await createProgram(input);
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
    const program = await updateProgram(req.params.id, input);
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
    const program = await publishProgram(req.params.id);
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
    await deleteProgram(req.params.id);
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
