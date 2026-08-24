import { prisma } from "@aratc/database";
import { createProgramSchema } from "@aratc/shared";
import { z } from "zod";
import { NotFoundError, ValidationError } from "../../lib/errors";
import type { CurriculumTemplate, CetExamTemplate } from "./templates";

type CreateProgramInput = z.infer<typeof createProgramSchema>;

export async function listPrograms(args?: { status?: "DRAFT" | "PUBLISHED" | "ARCHIVED" }) {
  return prisma.program.findMany({
    where: args?.status ? { status: args.status } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          curriculums: true,
          enrollments: true,
          assessments: true,
        },
      },
    },
  });
}

export async function getProgramBySlug(slug: string) {
  const program = await prisma.program.findUnique({
    where: { slug },
    include: {
      curriculums: {
        where: { status: "PUBLISHED" },
        orderBy: { orderIndex: "asc" },
        include: {
          items: {
            orderBy: { orderIndex: "asc" },
            include: {
              subject: {
                include: {
                  modules: {
                    where: { status: "PUBLISHED" },
                    orderBy: { orderIndex: "asc" },
                    include: {
                      topics: {
                        where: { status: "PUBLISHED" },
                        orderBy: { orderIndex: "asc" },
                        include: {
                          lessons: {
                            where: { status: "PUBLISHED" },
                            orderBy: { orderIndex: "asc" },
                            select: {
                              id: true,
                              title: true,
                              slug: true,
                              durationMinutes: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      assessments: {
        where: { status: "PUBLISHED" },
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
        },
      },
    },
  });

  if (!program) {
    throw new NotFoundError("Program not found");
  }

  return program;
}

export async function createProgram(input: CreateProgramInput) {
  return prisma.program.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      // Validator exposes `stage`; the DB column is `programType`.
      programType: input.stage,
      status: "DRAFT",
    },
  });
}

export async function updateProgram(id: string, input: Partial<CreateProgramInput>) {
  const existing = await prisma.program.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Program not found");
  }

  return prisma.program.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description,
      programType: input.stage ?? undefined,
    },
  });
}

export async function publishProgram(id: string) {
  const existing = await prisma.program.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Program not found");
  }

  return prisma.program.update({
    where: { id },
    data: { status: "PUBLISHED" },
  });
}

export async function deleteProgram(id: string) {
  const existing = await prisma.program.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Program not found");
  }

  return prisma.program.delete({ where: { id } });
}

// ============================================================
// Template-based bulk creation
// ============================================================

function makeSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

/**
 * Creates a program from a curriculum template in a single transaction.
 * Creates program -> curriculums (per grade) -> subjects -> modules -> topics -> questions.
 * Idempotent: if program slug exists, auto-generates a unique slug (e.g., "aratc-shs-curriculum-copy-abc1").
 */
export async function createProgramFromTemplate(
  template: CurriculumTemplate,
  authorId: string
) {
  // Large batch: extend timeout to 60s
  return prisma.$transaction(
    async (tx) => {
    // Generate unique program slug if base slug already exists
    let programSlug = template.program.slug;
    let programName = template.program.name;
    let counter = 1;
    while (true) {
      const existing = await tx.program.findUnique({ where: { slug: programSlug } });
      if (!existing) break;
      programSlug = `${template.program.slug}-copy-${counter}`;
      programName = `${template.program.name} (Copy ${counter})`;
      counter++;
    }

    // 1. Create the Program
    // Note: Prisma Program model has programType (string), not stage enum.
    // We store the stage value as programType for reference.
    const program = await tx.program.create({
      data: {
        name: programName,
        slug: programSlug,
        description: template.program.description,
        programType: template.program.stage,
        status: "DRAFT",
      },
    });

    // Map to collect all topic slugs -> IDs for CET exam reference
    const allTopicMap: Map<string, string> = new Map();

    // 2. For each grade, create a Curriculum with linked Subjects (upsert)
    for (const grade of template.grades) {
      const gradeLabel = grade.gradeLevel.replace("GRADE_", "Grade ");
      const curriculumSlug = `${template.program.slug}-${grade.gradeLevel.toLowerCase()}`;

      const curriculum = await tx.curriculum.upsert({
        where: { slug: curriculumSlug },
        update: {
          name: `${template.program.name} - ${gradeLabel}`,
          description: `Curriculum for ${gradeLabel}`,
          stage: template.program.stage,
          gradeLevel: grade.gradeLevel,
          programId: program.id,
          orderIndex: parseInt(grade.gradeLevel.replace("GRADE_", ""), 10),
          status: "DRAFT",
        },
        create: {
          name: `${template.program.name} - ${gradeLabel}`,
          slug: curriculumSlug,
          description: `Curriculum for ${gradeLabel}`,
          stage: template.program.stage,
          gradeLevel: grade.gradeLevel,
          programId: program.id,
          orderIndex: parseInt(grade.gradeLevel.replace("GRADE_", ""), 10),
          status: "DRAFT",
        },
      });

      // 3. Create Subjects for this grade
      for (let subjIdx = 0; subjIdx < grade.subjects.length; subjIdx++) {
        const subj = grade.subjects[subjIdx];

        // Check if subject already exists by slug
        const existingSubject = await tx.subject.findUnique({
          where: { slug: subj.slug },
        });

        let subject = existingSubject;

        if (!subject) {
          subject = await tx.subject.create({
            data: {
              name: subj.name,
              slug: subj.slug,
              code: subj.code,
              description: subj.description,
              color: subj.color,
              status: "DRAFT",
            },
          });
        }

        // 4. Link Subject to Curriculum via CurriculumItem (upsert)
        await tx.curriculumItem.upsert({
          where: { curriculumId_subjectId: { curriculumId: curriculum.id, subjectId: subject.id } },
          update: { orderIndex: subjIdx, isRequired: true },
          create: {
            curriculumId: curriculum.id,
            subjectId: subject.id,
            orderIndex: subjIdx,
            isRequired: true,
          },
        });

        // 5. Create Modules for this Subject (upsert by slug)
        for (let modIdx = 0; modIdx < subj.modules.length; modIdx++) {
          const mod = subj.modules[modIdx];

          const moduleRecord = await tx.module.upsert({
            where: { slug: mod.slug },
            update: {
              subjectId: subject.id,
              name: mod.name,
              description: mod.description,
              orderIndex: modIdx,
              status: "DRAFT",
            },
            create: {
              subjectId: subject.id,
              name: mod.name,
              slug: mod.slug,
              description: mod.description,
              orderIndex: modIdx,
              status: "DRAFT",
            },
          });

          // 6. Create Topics for this Module (upsert by slug)
          for (let topicIdx = 0; topicIdx < mod.topics.length; topicIdx++) {
            const topic = mod.topics[topicIdx];

            const topicRecord = await tx.topic.upsert({
              where: { slug: topic.slug },
              update: {
                moduleId: moduleRecord.id,
                name: topic.name,
                description: topic.description,
                orderIndex: topicIdx,
                status: "DRAFT",
              },
              create: {
                moduleId: moduleRecord.id,
                name: topic.name,
                slug: topic.slug,
                description: topic.description,
                orderIndex: topicIdx,
                status: "DRAFT",
              },
            });

            allTopicMap.set(topic.slug, topicRecord.id);

            // 7. Create sample Questions for this Topic (upsert by stem+topic)
            if (topic.questions && topic.questions.length > 0) {
              for (const q of topic.questions) {
                // Create a deterministic ID from stem + topic for idempotency
                const questionId = `q-${topicRecord.id}-${q.stem.slice(0, 30).replace(/[^a-z0-9]/gi, '-')}`;

                const question = await tx.question.upsert({
                  where: { id: questionId },
                  update: {
                    type: q.type,
                    difficulty: q.difficulty,
                    stem: q.stem,
                    options: q.options ?? undefined,
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation,
                    tags: q.tags,
                    authorId,
                    status: "PUBLISHED",
                  },
                  create: {
                    id: questionId,
                    type: q.type,
                    difficulty: q.difficulty,
                    stem: q.stem,
                    options: q.options ?? undefined,
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation,
                    tags: q.tags,
                    authorId,
                    status: "PUBLISHED",
                  },
                });

                // Link question to topic via QuestionBankLink (skip if exists)
                const existingLink = await tx.questionBankLink.findFirst({
                  where: { questionId: question.id, topicId: topicRecord.id },
                });
                if (!existingLink) {
                  await tx.questionBankLink.create({
                    data: {
                      questionId: question.id,
                      topicId: topicRecord.id,
                      weight: 1,
                    },
                  });
                }
              }
            }
          }
        }
      }
    }

    return {
      programId: program.id,
      programName: program.name,
      curriculaCount: template.grades.length,
      topicMap: allTopicMap,
    };
  },
  { timeout: 60000 }
);
}

/**
 * Creates CET mock exam assessments linked to the program's topics.
 * Each exam uses topicIds for question pool-based assessment.
 */
export async function createCetMockExams(
  programId: string,
  cetExams: CetExamTemplate[],
  topicMap: Map<string, string>
) {
  return prisma.$transaction(async (tx) => {
    const program = await tx.program.findUnique({
      where: { id: programId },
    });

    if (!program) {
      throw new NotFoundError("Program not found");
    }

    const created: { name: string; slug: string; assessmentId: string }[] = [];

    for (const cet of cetExams) {
      // Resolve topic slugs to IDs
      const resolvedTopicIds = cet.topicSlugs
        .map((slug) => topicMap.get(slug))
        .filter((id): id is string => !!id);

      // Generate unique slug
      let slug = cet.slug;
      let counter = 1;
      while (true) {
        const existing = await tx.assessment.findUnique({ where: { slug } });
        if (!existing) break;
        slug = `${cet.slug}-${counter}`;
        counter++;
      }

      const assessment = await tx.assessment.create({
        data: {
          name: cet.name,
          slug,
          description: cet.description,
          type: cet.type,
          topicIds: resolvedTopicIds,
          questionCount: cet.questionCount,
          timeLimitMinutes: cet.timeLimitMinutes,
          passingScore: cet.passingScore,
          randomizeQuestions: true,
          randomizeChoices: true,
          showExplanations: true,
          allowRetake: true,
          maxAttempts: 3,
          programId: program.id,
          status: "DRAFT",
        },
      });

      created.push({
        name: cet.name,
        slug: assessment.slug,
        assessmentId: assessment.id,
      });
    }

    return created;
  });
}
