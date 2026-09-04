import { prisma } from "@aratc/database";
import { createSubjectSchema } from "./schemas";
import { ConflictError, NotFoundError } from "../../lib/errors";
import {
  type ContentVisibilityOptions,
  isVisible,
  publishedOnly,
} from "../../lib/visibility";
import type { CreateSubjectInput } from "./schemas";

// Prisma P2002 (unique-constraint violation) surfaces as a plain object with
// a `code` property — narrow it structurally instead of importing the Prisma
// client runtime into the service layer.
function isUniqueViolation(
  err: unknown,
): err is { code: "P2002"; meta?: { target?: string[] } } {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: unknown }).code === "P2002"
  );
}

export async function listSubjects(opts?: ContentVisibilityOptions) {
  return prisma.subject.findMany({
    where: publishedOnly(opts),
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          modules: true,
          curriculumItems: true,
          examCoverages: true,
        },
      },
    },
  });
}

export async function getSubjectById(
  id: string,
  opts?: ContentVisibilityOptions
) {
  const subject = await prisma.subject.findUnique({
    where: { id },
    include: {
      modules: {
        // Nested drafts are hidden from non-privileged callers as well.
        ...(opts?.includeUnpublished ? {} : { where: { status: "PUBLISHED" as const } }),
        orderBy: { orderIndex: "asc" },
        include: {
          _count: { select: { topics: true } },
        },
      },
      curriculumItems: {
        include: { curriculum: { select: { id: true, name: true, program: { select: { name: true } } } } },
      },
      examCoverages: {
        include: { cetProfile: { select: { id: true, name: true, cetExam: { select: { name: true } } } } },
      },
    },
  });

  if (!subject || !isVisible(subject.status, opts)) {
    throw new NotFoundError("Subject not found");
  }

  return subject;
}

export async function getSubjectBySlug(
  slug: string,
  opts?: ContentVisibilityOptions
) {
  const subject = await prisma.subject.findUnique({
    where: { slug },
    include: {
      modules: {
        ...(opts?.includeUnpublished ? {} : { where: { status: "PUBLISHED" as const } }),
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
  });

  if (!subject || !isVisible(subject.status, opts)) {
    throw new NotFoundError("Subject not found");
  }

  return subject;
}

export async function createSubject(input: CreateSubjectInput) {
  // Reject duplicate subject codes up-front with a friendly 409 instead of
  // letting the DB's unique constraint surface as an opaque 500.
  if (input.code) {
    const codeTaken = await prisma.subject.findUnique({
      where: { code: input.code },
    });
    if (codeTaken) {
      throw new ConflictError(
        `A subject with code "${input.code}" already exists. Please choose a different code.`,
      );
    }
  }

  // Generate unique slug if needed
  let slug = input.slug;
  let counter = 1;
  while (true) {
    const existing = await prisma.subject.findUnique({ where: { slug } });
    if (!existing) break;
    slug = `${input.slug}-${counter}`;
    counter++;
  }

  try {
    return await prisma.subject.create({
      data: {
        name: input.name,
        slug,
        code: input.code,
        description: input.description,
        icon: input.icon,
        color: input.color,
        status: "DRAFT",
      },
    });
  } catch (err) {
    // Race-condition safety net: another request may have created the same
    // code/slug between the pre-check and this insert.
    if (isUniqueViolation(err)) {
      throw new ConflictError(
        "A subject with the same code or slug already exists. Please adjust and try again.",
      );
    }
    throw err;
  }
}

export async function updateSubject(id: string, input: Partial<CreateSubjectInput>) {
  const existing = await prisma.subject.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Subject not found");
  }

  // Reject duplicate subject codes up-front (excluding this subject itself).
  if (input.code && input.code !== existing.code) {
    const codeTaken = await prisma.subject.findUnique({
      where: { code: input.code },
    });
    if (codeTaken) {
      throw new ConflictError(
        `A subject with code "${input.code}" already exists. Please choose a different code.`,
      );
    }
  }

  // Generate unique slug if slug is being changed
  let slug = input.slug || existing.slug;
  if (input.slug && input.slug !== existing.slug) {
    let counter = 1;
    while (true) {
      const duplicate = await prisma.subject.findUnique({ where: { slug } });
      if (!duplicate || duplicate.id === id) break;
      slug = `${input.slug}-${counter}`;
      counter++;
    }
  }

  try {
    return await prisma.subject.update({
      where: { id },
      data: {
        name: input.name,
        slug,
        code: input.code,
        description: input.description,
        icon: input.icon,
        color: input.color,
      },
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new ConflictError(
        "Another subject already uses that code or slug. Please choose a different value.",
      );
    }
    throw err;
  }
}

export async function publishSubject(id: string) {
  const existing = await prisma.subject.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Subject not found");
  }

  return prisma.subject.update({
    where: { id },
    data: { status: "PUBLISHED" },
  });
}

export async function archiveSubject(id: string) {
  const existing = await prisma.subject.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Subject not found");
  }

  return prisma.subject.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });
}

export async function deleteSubject(id: string) {
  const existing = await prisma.subject.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Subject not found");
  }

  return prisma.subject.delete({ where: { id } });
}

export async function getSubjectStats(id: string) {
  const subject = await prisma.subject.findUnique({
    where: { id },
    include: {
      modules: {
        include: {
          topics: {
            include: {
              lessons: true,
            },
          },
        },
      },
      curriculumItems: true,
      examCoverages: true,
      questions: true,
    },
  });

  if (!subject) {
    throw new NotFoundError("Subject not found");
  }

  const stats = {
    totalModules: subject.modules.length,
    totalTopics: subject.modules.reduce((sum, m) => sum + m.topics.length, 0),
    totalLessons: subject.modules.reduce(
      (sum, m) => sum + m.topics.reduce((s, t) => s + t.lessons.length, 0),
      0
    ),
    totalQuestions: subject.questions.length,
    linkedCurriculums: subject.curriculumItems.length,
    linkedExams: subject.examCoverages.length,
  };

  return stats;
}
