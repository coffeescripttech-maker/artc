import { Request, Response, NextFunction } from "express";
import { validateRequest } from "../../lib/validate";
import {
  // Universities
  listUniversities,
  getUniversityById,
  createUniversity,
  updateUniversity,
  deleteUniversity,
  // Exams
  listExams,
  getExamById,
  createExam,
  updateExam,
  publishExam,
  archiveExam,
  deleteExam,
  // Profiles
  listProfiles,
  getProfileById,
  createProfile,
  updateProfile,
  publishProfile,
  archiveProfile,
  deleteProfile,
  // Coverage
  addCoverage,
  updateCoverage,
  removeCoverage,
  // Program links
  linkProgramExam,
  unlinkProgramExam,
  getProgramExams,
  // Stats
  getExamStats,
  getProfileStats,
} from "./service";

// ============================================================
// Universities
// ============================================================

export async function listUniversitiesHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const universities = await listUniversities();
    res.json(universities);
  } catch (error) {
    next(error);
  }
}

export async function getUniversity(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const university = await getUniversityById(req.params.id);
    res.json(university);
  } catch (error) {
    next(error);
  }
}

export async function createUniversityHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { createUniversitySchema } = await import("./schemas.js");
    const input = validateRequest(createUniversitySchema, req.body);
    const university = await createUniversity(input);
    res.status(201).json(university);
  } catch (error) {
    next(error);
  }
}

export async function updateUniversityHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { updateUniversitySchema } = await import("./schemas.js");
    const input = validateRequest(updateUniversitySchema, req.body);
    const university = await updateUniversity(req.params.id, input);
    res.json(university);
  } catch (error) {
    next(error);
  }
}

export async function deleteUniversityHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await deleteUniversity(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

// ============================================================
// Exams
// ============================================================

export async function listExamsHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const exams = await listExams();
    res.json(exams);
  } catch (error) {
    next(error);
  }
}

export async function getExam(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const exam = await getExamById(req.params.id);
    res.json(exam);
  } catch (error) {
    next(error);
  }
}

export async function createExamHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { createExamSchema } = await import("./schemas.js");
    const input = validateRequest(createExamSchema, req.body);
    const exam = await createExam(input);
    res.status(201).json(exam);
  } catch (error) {
    next(error);
  }
}

export async function updateExamHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { updateExamSchema } = await import("./schemas.js");
    const input = validateRequest(updateExamSchema, req.body);
    const exam = await updateExam(req.params.id, input);
    res.json(exam);
  } catch (error) {
    next(error);
  }
}

export async function publishExamHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const exam = await publishExam(req.params.id);
    res.json(exam);
  } catch (error) {
    next(error);
  }
}

export async function archiveExamHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const exam = await archiveExam(req.params.id);
    res.json(exam);
  } catch (error) {
    next(error);
  }
}

export async function deleteExamHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await deleteExam(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function examStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stats = await getExamStats(req.params.id);
    res.json(stats);
  } catch (error) {
    next(error);
  }
}

// ============================================================
// Profiles
// ============================================================

export async function listProfilesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const examId = req.query.examId as string | undefined;
    const profiles = await listProfiles(examId);
    res.json(profiles);
  } catch (error) {
    next(error);
  }
}

export async function getProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const profile = await getProfileById(req.params.id);
    res.json(profile);
  } catch (error) {
    next(error);
  }
}

export async function createProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { createProfileSchema } = await import("./schemas.js");
    const input = validateRequest(createProfileSchema, req.body);
    const profile = await createProfile(input);
    res.status(201).json(profile);
  } catch (error) {
    next(error);
  }
}

export async function updateProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { updateProfileSchema } = await import("./schemas.js");
    const input = validateRequest(updateProfileSchema, req.body);
    const profile = await updateProfile(req.params.id, input);
    res.json(profile);
  } catch (error) {
    next(error);
  }
}

export async function publishProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const profile = await publishProfile(req.params.id);
    res.json(profile);
  } catch (error) {
    next(error);
  }
}

export async function archiveProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const profile = await archiveProfile(req.params.id);
    res.json(profile);
  } catch (error) {
    next(error);
  }
}

export async function deleteProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await deleteProfile(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function profileStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stats = await getProfileStats(req.params.id);
    res.json(stats);
  } catch (error) {
    next(error);
  }
}

// ============================================================
// Coverage
// ============================================================

export async function addCoverageHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { addCoverageSchema } = await import("./schemas.js");
    const input = validateRequest(addCoverageSchema, req.body);
    const coverage = await addCoverage(req.params.id, input);
    res.status(201).json(coverage);
  } catch (error) {
    next(error);
  }
}

export async function updateCoverageHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { updateCoverageSchema } = await import("./schemas.js");
    const input = validateRequest(updateCoverageSchema, req.body);
    const coverage = await updateCoverage(req.params.coverageId, input);
    res.json(coverage);
  } catch (error) {
    next(error);
  }
}

export async function removeCoverageHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await removeCoverage(req.params.coverageId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

// ============================================================
// Program links
// ============================================================

export async function linkProgramHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { linkProgramExamSchema } = await import("./schemas.js");
    const input = validateRequest(linkProgramExamSchema, req.body);
    const link = await linkProgramExam(req.params.programId, input);
    res.status(201).json(link);
  } catch (error) {
    next(error);
  }
}

export async function unlinkProgramHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await unlinkProgramExam(req.params.programId, req.params.examId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function getProgramExamsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const exams = await getProgramExams(req.params.programId);
    res.json(exams);
  } catch (error) {
    next(error);
  }
}
