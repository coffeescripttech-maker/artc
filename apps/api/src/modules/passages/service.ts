import { prisma } from "@aratc/database";
import { NotFoundError } from "../../lib/errors";
import type { CreatePassageInput } from "./schemas";

export async function listPassages(filters?: {
  status?: string;
}) {
  const where: any = {};
  if (filters?.status) {
    where.status = filters.status;
  }

  return prisma.passage.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { questions: true },
      },
    },
  });
}

export async function getPassageById(id: string) {
  const passage = await prisma.passage.findUnique({
    where: { id },
    include: {
      questions: {
        where: { status: "PUBLISHED" },
        select: {
          id: true,
          stem: true,
          type: true,
          difficulty: true,
        },
      },
    },
  });

  if (!passage) {
    throw new NotFoundError("Passage not found");
  }

  return passage;
}

export async function createPassage(input: CreatePassageInput) {
  return prisma.passage.create({
    data: {
      title: input.title,
      content: input.content,
      sourceUrl: input.sourceUrl || null,
      status: input.status || "DRAFT",
    },
  });
}

export async function updatePassage(id: string, input: Partial<CreatePassageInput>) {
  const existing = await prisma.passage.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Passage not found");
  }

  return prisma.passage.update({
    where: { id },
    data: {
      title: input.title,
      content: input.content,
      sourceUrl: input.sourceUrl || null,
      status: input.status,
    },
  });
}

export async function publishPassage(id: string) {
  const existing = await prisma.passage.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Passage not found");
  }

  return prisma.passage.update({
    where: { id },
    data: { status: "PUBLISHED" },
  });
}

export async function archivePassage(id: string) {
  const existing = await prisma.passage.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Passage not found");
  }

  return prisma.passage.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });
}

export async function deletePassage(id: string) {
  const existing = await prisma.passage.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Passage not found");
  }

  return prisma.passage.delete({ where: { id } });
}

export async function getPassageStats(id: string) {
  const passage = await prisma.passage.findUnique({
    where: { id },
    include: {
      _count: {
        select: { questions: true },
      },
    },
  });

  if (!passage) {
    throw new NotFoundError("Passage not found");
  }

  return {
    totalQuestions: passage._count.questions,
    wordCount: passage.content.split(/\s+/).length,
  };
}
