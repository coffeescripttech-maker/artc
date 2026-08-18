import { prisma } from "@aratc/database";
import { createCurriculumSchema, addCurriculumItemSchema } from "./schemas";
import { NotFoundError, BadRequestError } from "../../lib/errors";
import type { CreateCurriculumInput, UpdateCurriculumInput, AddCurriculumItemInput, UpdateCurriculumItemInput } from "./schemas";

export async function listCurriculums(programId?: string) {
  const where = programId ? { programId } : {};

  return prisma.curriculum.findMany({
    where,
    orderBy: [{ programId: "asc" }, { orderIndex: "asc" }],
    include: {
      program: { select: { id: true, name: true, slug: true } },
      items: {
        orderBy: { orderIndex: "asc" },
        include: {
          subject: {
            include: {
              modules: {
                orderBy: { orderIndex: "asc" },
                include: {
                  topics: {
                    orderBy: { orderIndex: "asc" },
                    include: {
                      _count: { select: { lessons: true } },
                      lessons: {
                        orderBy: { orderIndex: "asc" },
                        select: {
                          id: true,
                          title: true,
                          slug: true,
                          type: true,
                          status: true,
                          durationMinutes: true,
                          orderIndex: true,
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
      _count: { select: { learnerProfiles: true } },
    },
  });
}

export async function getCurriculumById(id: string) {
  const curriculum = await prisma.curriculum.findUnique({
    where: { id },
    include: {
      program: { select: { id: true, name: true, slug: true } },
      items: {
        orderBy: { orderIndex: "asc" },
        include: {
          subject: {
            include: {
              modules: {
                orderBy: { orderIndex: "asc" },
                include: {
                  topics: {
                    orderBy: { orderIndex: "asc" },
                    include: {
                      _count: { select: { lessons: true } },
                      lessons: {
                        orderBy: { orderIndex: "asc" },
                        take: 10, // Limit lessons shown inline
                        select: {
                          id: true,
                          title: true,
                          slug: true,
                          type: true,
                          status: true,
                          orderIndex: true,
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
  });

  if (!curriculum) {
    throw new NotFoundError("Curriculum not found");
  }

  return curriculum;
}

export async function getCurriculumBySlug(slug: string) {
  const curriculum = await prisma.curriculum.findUnique({
    where: { slug },
    include: {
      program: { select: { id: true, name: true, slug: true } },
      items: {
        orderBy: { orderIndex: "asc" },
        include: {
          subject: {
            include: {
              modules: {
                orderBy: { orderIndex: "asc" },
                include: {
                  topics: {
                    orderBy: { orderIndex: "asc" },
                    include: {
                      lessons: {
                        where: { status: "PUBLISHED" },
                        orderBy: { orderIndex: "asc" },
                        select: {
                          id: true,
                          title: true,
                          slug: true,
                          type: true,
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
  });

  if (!curriculum) {
    throw new NotFoundError("Curriculum not found");
  }

  return curriculum;
}

export async function createCurriculum(input: CreateCurriculumInput) {
  // Verify program exists
  const program = await prisma.program.findUnique({ where: { id: input.programId } });
  if (!program) {
    throw new NotFoundError("Program not found");
  }

  // Generate unique slug if needed
  let slug = input.slug;
  let counter = 1;
  while (true) {
    const existing = await prisma.curriculum.findUnique({ where: { slug } });
    if (!existing) break;
    slug = `${input.slug}-${counter}`;
    counter++;
  }

  return prisma.curriculum.create({
    data: {
      name: input.name,
      slug,
      description: input.description,
      stage: input.stage,
      gradeLevel: input.gradeLevel,
      programId: input.programId,
      orderIndex: input.orderIndex ?? 0,
      status: "DRAFT",
    },
  });
}

export async function updateCurriculum(id: string, input: UpdateCurriculumInput) {
  const existing = await prisma.curriculum.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Curriculum not found");
  }

  return prisma.curriculum.update({
    where: { id },
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      stage: input.stage,
      gradeLevel: input.gradeLevel,
      orderIndex: input.orderIndex,
      status: input.status,
    },
  });
}

export async function publishCurriculum(id: string) {
  const existing = await prisma.curriculum.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Curriculum not found");
  }

  return prisma.curriculum.update({
    where: { id },
    data: { status: "PUBLISHED" },
  });
}

export async function archiveCurriculum(id: string) {
  const existing = await prisma.curriculum.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Curriculum not found");
  }

  return prisma.curriculum.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });
}

export async function deleteCurriculum(id: string) {
  const existing = await prisma.curriculum.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Curriculum not found");
  }

  return prisma.curriculum.delete({ where: { id } });
}

// Curriculum Items
export async function addCurriculumItem(curriculumId: string, input: AddCurriculumItemInput) {
  // Verify curriculum exists
  const curriculum = await prisma.curriculum.findUnique({ where: { id: curriculumId } });
  if (!curriculum) {
    throw new NotFoundError("Curriculum not found");
  }

  // Verify subject exists
  const subject = await prisma.subject.findUnique({ where: { id: input.subjectId } });
  if (!subject) {
    throw new NotFoundError("Subject not found");
  }

  // Check if already linked
  const existing = await prisma.curriculumItem.findFirst({
    where: { curriculumId, subjectId: input.subjectId },
  });
  if (existing) {
    throw new BadRequestError("Subject is already in this curriculum");
  }

  // Get max orderIndex if not provided
  let orderIndex = input.orderIndex;
  if (orderIndex === undefined) {
    const maxItem = await prisma.curriculumItem.findFirst({
      where: { curriculumId },
      orderBy: { orderIndex: "desc" },
    });
    orderIndex = (maxItem?.orderIndex ?? -1) + 1;
  }

  return prisma.curriculumItem.create({
    data: {
      curriculumId,
      subjectId: input.subjectId,
      orderIndex,
      isRequired: input.isRequired ?? true,
      customName: input.customName,
    },
    include: {
      subject: { select: { id: true, name: true, slug: true, code: true } },
    },
  });
}

export async function updateCurriculumItem(id: string, input: UpdateCurriculumItemInput) {
  const existing = await prisma.curriculumItem.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Curriculum item not found");
  }

  return prisma.curriculumItem.update({
    where: { id },
    data: {
      orderIndex: input.orderIndex,
      isRequired: input.isRequired,
      customName: input.customName,
    },
  });
}

export async function reorderCurriculumItems(curriculumId: string, itemIds: string[]) {
  // Verify all items belong to this curriculum
  const items = await prisma.curriculumItem.findMany({
    where: { curriculumId, id: { in: itemIds } },
  });

  if (items.length !== itemIds.length) {
    throw new BadRequestError("Some items don't belong to this curriculum");
  }

  // Update order
  await prisma.$transaction(
    itemIds.map((id, index) =>
      prisma.curriculumItem.update({
        where: { id },
        data: { orderIndex: index },
      })
    )
  );

  return prisma.curriculumItem.findMany({
    where: { curriculumId },
    orderBy: { orderIndex: "asc" },
    include: { subject: { select: { id: true, name: true, slug: true } } },
  });
}

export async function removeCurriculumItem(id: string) {
  const existing = await prisma.curriculumItem.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Curriculum item not found");
  }

  return prisma.curriculumItem.delete({ where: { id } });
}

export async function getCurriculumStats(id: string) {
  const curriculum = await prisma.curriculum.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          subject: {
            include: {
              modules: {
                include: {
                  topics: {
                    include: { lessons: true },
                  },
                },
              },
            },
          },
        },
      },
      _count: { select: { learnerProfiles: true } },
    },
  });

  if (!curriculum) {
    throw new NotFoundError("Curriculum not found");
  }

  const stats = {
    totalSubjects: curriculum.items.length,
    requiredSubjects: curriculum.items.filter((i) => i.isRequired).length,
    totalModules: curriculum.items.reduce((sum, i) => sum + i.subject.modules.length, 0),
    totalTopics: curriculum.items.reduce(
      (sum, i) => sum + i.subject.modules.reduce((s, m) => s + m.topics.length, 0),
      0
    ),
    totalLessons: curriculum.items.reduce(
      (sum, i) =>
        sum + i.subject.modules.reduce((s, m) => s + m.topics.reduce((t, topic) => t + topic.lessons.length, 0), 0),
      0
    ),
    enrolledLearners: curriculum._count.learnerProfiles,
  };

  return stats;
}
