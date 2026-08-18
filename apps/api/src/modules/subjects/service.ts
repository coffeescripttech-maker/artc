import { prisma } from "@aratc/database";
import { createSubjectSchema } from "./schemas";
import { NotFoundError } from "../../lib/errors";
import type { CreateSubjectInput } from "./schemas";

export async function listSubjects() {
  return prisma.subject.findMany({
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

export async function getSubjectById(id: string) {
  const subject = await prisma.subject.findUnique({
    where: { id },
    include: {
      modules: {
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

  if (!subject) {
    throw new NotFoundError("Subject not found");
  }

  return subject;
}

export async function getSubjectBySlug(slug: string) {
  const subject = await prisma.subject.findUnique({
    where: { slug },
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
  });

  if (!subject) {
    throw new NotFoundError("Subject not found");
  }

  return subject;
}

export async function createSubject(input: CreateSubjectInput) {
  // Generate unique slug if needed
  let slug = input.slug;
  let counter = 1;
  while (true) {
    const existing = await prisma.subject.findUnique({ where: { slug } });
    if (!existing) break;
    slug = `${input.slug}-${counter}`;
    counter++;
  }

  return prisma.subject.create({
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
}

export async function updateSubject(id: string, input: Partial<CreateSubjectInput>) {
  const existing = await prisma.subject.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Subject not found");
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

  return prisma.subject.update({
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
