import { prisma } from "@aratc/database";
import { NotFoundError, BadRequestError } from "../../lib/errors";
import type {
  CreateUniversityInput,
  UpdateUniversityInput,
  CreateExamInput,
  UpdateExamInput,
  CreateProfileInput,
  UpdateProfileInput,
  AddCoverageInput,
  UpdateCoverageInput,
  LinkProgramExamInput,
} from "./schemas";

// ============================================================
// Universities (handled as CET Exam entries)
// ============================================================

export async function listUniversities() {
  return prisma.cetExam.findMany({
    orderBy: { name: "asc" },
    include: {
      profiles: { select: { id: true, name: true } },
      _count: { select: { programTargets: true } },
    },
  });
}

export async function getUniversityById(id: string) {
  const university = await prisma.cetExam.findUnique({
    where: { id },
    include: {
      profiles: {
        include: {
          coverages: {
            include: { subject: { select: { id: true, name: true, slug: true } } },
          },
        },
      },
      programTargets: {
        include: { program: { select: { id: true, name: true, slug: true } } },
      },
    },
  });

  if (!university) {
    throw new NotFoundError("University not found");
  }

  return university;
}

export async function createUniversity(input: CreateUniversityInput) {
  return prisma.cetExam.create({
    data: {
      name: input.name,
      slug: input.slug,
      examType: "ENTRANCE",
      conductingBody: input.name,
      description: input.description,
      website: input.website,
      status: "PUBLISHED",
    },
  });
}

export async function updateUniversity(id: string, input: UpdateUniversityInput) {
  const existing = await prisma.cetExam.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("University not found");
  }

  return prisma.cetExam.update({
    where: { id },
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      website: input.website,
    },
  });
}

export async function deleteUniversity(id: string) {
  const existing = await prisma.cetExam.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("University not found");
  }

  return prisma.cetExam.delete({ where: { id } });
}

// ============================================================
// CET Exams
// ============================================================

export async function listExams() {
  return prisma.cetExam.findMany({
    orderBy: { name: "asc" },
    include: {
      profiles: {
        select: { id: true, name: true, status: true },
      },
      _count: {
        select: { programTargets: true },
      },
    },
  });
}

export async function getExamById(id: string) {
  const exam = await prisma.cetExam.findUnique({
    where: { id },
    include: {
      profiles: {
        include: {
          coverages: {
            include: { subject: { select: { id: true, name: true, slug: true } } },
          },
        },
      },
      programTargets: {
        include: { program: { select: { id: true, name: true, slug: true } } },
      },
    },
  });

  if (!exam) {
    throw new NotFoundError("Exam not found");
  }

  return exam;
}

export async function createExam(input: CreateExamInput) {
  return prisma.cetExam.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      examType: input.examType,
      conductingBody: input.conductingBody,
      website: input.website,
      status: "DRAFT",
    },
  });
}

export async function updateExam(id: string, input: UpdateExamInput) {
  const existing = await prisma.cetExam.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Exam not found");
  }

  return prisma.cetExam.update({
    where: { id },
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      examType: input.examType,
      conductingBody: input.conductingBody,
      website: input.website,
    },
  });
}

export async function publishExam(id: string) {
  const existing = await prisma.cetExam.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Exam not found");
  }

  return prisma.cetExam.update({
    where: { id },
    data: { status: "PUBLISHED" },
  });
}

export async function archiveExam(id: string) {
  const existing = await prisma.cetExam.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Exam not found");
  }

  return prisma.cetExam.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });
}

export async function deleteExam(id: string) {
  const existing = await prisma.cetExam.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Exam not found");
  }

  return prisma.cetExam.delete({ where: { id } });
}

// ============================================================
// CET Profiles
// ============================================================

export async function listProfiles(examId?: string) {
  const where = examId ? { cetExamId: examId } : {};

  return prisma.cetProfile.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      cetExam: { select: { id: true, name: true, slug: true } },
      coverages: {
        include: { subject: { select: { id: true, name: true, slug: true } } },
      },
      _count: { select: { coverages: true } },
    },
  });
}

export async function getProfileById(id: string) {
  const profile = await prisma.cetProfile.findUnique({
    where: { id },
    include: {
      cetExam: { select: { id: true, name: true, slug: true } },
      coverages: {
        include: {
          subject: {
            include: {
              modules: {
                select: { id: true, name: true, topics: { select: { id: true, name: true } } },
              },
            },
          },
        },
      },
    },
  });

  if (!profile) {
    throw new NotFoundError("Profile not found");
  }

  return profile;
}

export async function createProfile(input: CreateProfileInput) {
  // Verify exam exists
  const exam = await prisma.cetExam.findUnique({ where: { id: input.cetExamId } });
  if (!exam) {
    throw new NotFoundError("CET Exam not found");
  }

  return prisma.cetProfile.create({
    data: {
      cetExamId: input.cetExamId,
      name: input.name,
      description: input.description,
      totalQuestions: input.totalQuestions,
      timeLimitMinutes: input.timeLimitMinutes,
      passingScore: input.passingScore,
      difficultyDistribution: input.difficultyDistribution
        ? JSON.stringify(input.difficultyDistribution)
        : undefined,
      status: "DRAFT",
    },
  });
}

export async function updateProfile(id: string, input: UpdateProfileInput) {
  const existing = await prisma.cetProfile.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Profile not found");
  }

  return prisma.cetProfile.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description,
      totalQuestions: input.totalQuestions,
      timeLimitMinutes: input.timeLimitMinutes,
      passingScore: input.passingScore,
      difficultyDistribution: input.difficultyDistribution
        ? JSON.stringify(input.difficultyDistribution)
        : undefined,
    },
  });
}

export async function publishProfile(id: string) {
  const existing = await prisma.cetProfile.findUnique({
    where: { id },
    include: { _count: { select: { coverages: true } } },
  });
  if (!existing) {
    throw new NotFoundError("Profile not found");
  }

  if (existing._count.coverages === 0) {
    throw new BadRequestError("Cannot publish a profile with no subject coverage");
  }

  return prisma.cetProfile.update({
    where: { id },
    data: { status: "PUBLISHED" },
  });
}

export async function archiveProfile(id: string) {
  const existing = await prisma.cetProfile.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Profile not found");
  }

  return prisma.cetProfile.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });
}

export async function deleteProfile(id: string) {
  const existing = await prisma.cetProfile.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Profile not found");
  }

  return prisma.cetProfile.delete({ where: { id } });
}

// ============================================================
// Exam Coverage
// ============================================================

export async function addCoverage(profileId: string, input: AddCoverageInput) {
  const profile = await prisma.cetProfile.findUnique({ where: { id: profileId } });
  if (!profile) {
    throw new NotFoundError("Profile not found");
  }

  const subject = await prisma.subject.findUnique({ where: { id: input.subjectId } });
  if (!subject) {
    throw new NotFoundError("Subject not found");
  }

  // Check if already covered
  const existing = await prisma.examCoverage.findFirst({
    where: { cetProfileId: profileId, subjectId: input.subjectId },
  });
  if (existing) {
    throw new BadRequestError("Subject is already covered in this profile");
  }

  return prisma.examCoverage.create({
    data: {
      cetProfileId: profileId,
      subjectId: input.subjectId,
      percentage: input.percentage,
      questionCount: input.questionCount,
      topicCoverage: input.topicCoverage ? JSON.stringify(input.topicCoverage) : undefined,
    },
    include: {
      subject: { select: { id: true, name: true, slug: true } },
    },
  });
}

export async function updateCoverage(id: string, input: UpdateCoverageInput) {
  const existing = await prisma.examCoverage.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Coverage not found");
  }

  return prisma.examCoverage.update({
    where: { id },
    data: {
      percentage: input.percentage,
      questionCount: input.questionCount,
      topicCoverage: input.topicCoverage ? JSON.stringify(input.topicCoverage) : undefined,
    },
  });
}

export async function removeCoverage(id: string) {
  const existing = await prisma.examCoverage.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Coverage not found");
  }

  return prisma.examCoverage.delete({ where: { id } });
}

// ============================================================
// Program CET Links
// ============================================================

export async function linkProgramExam(programId: string, input: LinkProgramExamInput) {
  const program = await prisma.program.findUnique({ where: { id: programId } });
  if (!program) {
    throw new NotFoundError("Program not found");
  }

  const exam = await prisma.cetExam.findUnique({ where: { id: input.cetExamId } });
  if (!exam) {
    throw new NotFoundError("CET Exam not found");
  }

  // Check if already linked
  const existing = await prisma.programCet.findFirst({
    where: { programId, cetExamId: input.cetExamId },
  });
  if (existing) {
    throw new BadRequestError("Exam is already linked to this program");
  }

  return prisma.programCet.create({
    data: {
      programId,
      cetExamId: input.cetExamId,
      priority: input.priority ?? 1,
      notes: input.notes,
    },
    include: {
      program: { select: { id: true, name: true } },
      cetExam: { select: { id: true, name: true, slug: true } },
    },
  });
}

export async function unlinkProgramExam(programId: string, examId: string) {
  const existing = await prisma.programCet.findFirst({
    where: { programId, cetExamId: examId },
  });
  if (!existing) {
    throw new NotFoundError("Exam link not found");
  }

  return prisma.programCet.delete({ where: { id: existing.id } });
}

export async function getProgramExams(programId: string) {
  return prisma.programCet.findMany({
    where: { programId },
    orderBy: { priority: "asc" },
    include: {
      cetExam: {
        include: {
          profiles: { select: { id: true, name: true } },
        },
      },
    },
  });
}

// ============================================================
// Stats
// ============================================================

export async function getExamStats(id: string) {
  const exam = await prisma.cetExam.findUnique({
    where: { id },
    include: {
      profiles: {
        include: {
          _count: { select: { coverages: true } },
        },
      },
      _count: { select: { programTargets: true, profiles: true } },
    },
  });

  if (!exam) {
    throw new NotFoundError("Exam not found");
  }

  return {
    totalProfiles: exam._count.profiles,
    linkedPrograms: exam._count.programTargets,
    subjectCount: exam.profiles.reduce((sum, p) => sum + p._count.coverages, 0),
  };
}

export async function getProfileStats(id: string) {
  const profile = await prisma.cetProfile.findUnique({
    where: { id },
    include: {
      coverages: true,
      _count: { select: { coverages: true } },
    },
  });

  if (!profile) {
    throw new NotFoundError("Profile not found");
  }

  return {
    totalSubjects: profile._count.coverages,
    totalPercentage: profile.coverages.reduce((sum, c) => sum + c.percentage, 0),
    totalQuestions: profile.totalQuestions ?? 0,
    timeLimit: profile.timeLimitMinutes ?? 0,
    passingScore: profile.passingScore ?? 0,
  };
}
