import { prisma } from "@aratc/database";
import { createProgramSchema } from "@aratc/shared";
import { z } from "zod";
import { NotFoundError } from "../../lib/errors";

type CreateProgramInput = z.infer<typeof createProgramSchema>;

export async function listPrograms() {
  return prisma.program.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { subjects: true },
      },
    },
  });
}

export async function getProgramBySlug(slug: string) {
  const program = await prisma.program.findUnique({
    where: { slug },
    include: {
      subjects: {
        orderBy: { orderIndex: "asc" },
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
      stage: input.stage,
      gradeLevel: input.gradeLevel,
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
      gradeLevel: input.gradeLevel,
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
