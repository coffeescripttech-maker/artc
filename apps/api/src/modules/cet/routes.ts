import { Router, type IRouter } from "express";
import {
  // Universities
  listUniversitiesHandler,
  getUniversity,
  createUniversityHandler,
  updateUniversityHandler,
  deleteUniversityHandler,
  // Exams
  listExamsHandler,
  getExam,
  createExamHandler,
  updateExamHandler,
  publishExamHandler,
  archiveExamHandler,
  deleteExamHandler,
  examStats,
  // Profiles
  listProfilesHandler,
  getProfile,
  createProfileHandler,
  updateProfileHandler,
  publishProfileHandler,
  archiveProfileHandler,
  deleteProfileHandler,
  profileStats,
  // Coverage
  addCoverageHandler,
  updateCoverageHandler,
  removeCoverageHandler,
  // Program links
  linkProgramHandler,
  unlinkProgramHandler,
  getProgramExamsHandler,
} from "./controller";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/permissions";

const router: IRouter = Router();

// ============================================================
// Universities
// ============================================================
const universities = Router();
universities.get("/", listUniversitiesHandler);
universities.get("/:id", getUniversity);
universities.post("/", authenticate, requirePermission("cet.universities_manage"), createUniversityHandler);
universities.put("/:id", authenticate, requirePermission("cet.universities_manage"), updateUniversityHandler);
universities.delete("/:id", authenticate, requirePermission("cet.universities_manage"), deleteUniversityHandler);

// ============================================================
// Exams
// ============================================================
const exams = Router();
exams.get("/", listExamsHandler);
exams.get("/:id", getExam);
exams.get("/:id/stats", examStats);
exams.post("/", authenticate, requirePermission("cet.exams_manage"), createExamHandler);
exams.put("/:id", authenticate, requirePermission("cet.exams_manage"), updateExamHandler);
exams.patch("/:id/publish", authenticate, requirePermission("cet.exams_manage"), publishExamHandler);
exams.patch("/:id/archive", authenticate, requirePermission("cet.exams_manage"), archiveExamHandler);
exams.delete("/:id", authenticate, requirePermission("cet.exams_manage"), deleteExamHandler);

// ============================================================
// Profiles
// ============================================================
const profiles = Router();
profiles.get("/", listProfilesHandler);
profiles.get("/:id", getProfile);
profiles.get("/:id/stats", profileStats);
profiles.post("/", authenticate, requirePermission("cet.profiles_manage"), createProfileHandler);
profiles.put("/:id", authenticate, requirePermission("cet.profiles_manage"), updateProfileHandler);
profiles.patch("/:id/publish", authenticate, requirePermission("cet.profiles_manage"), publishProfileHandler);
profiles.patch("/:id/archive", authenticate, requirePermission("cet.profiles_manage"), archiveProfileHandler);
profiles.delete("/:id", authenticate, requirePermission("cet.profiles_manage"), deleteProfileHandler);

// Coverage routes (nested under profiles)
profiles.post("/:id/coverage", authenticate, requirePermission("cet.profiles_manage"), addCoverageHandler);
profiles.patch("/coverage/:coverageId", authenticate, requirePermission("cet.profiles_manage"), updateCoverageHandler);
profiles.delete("/coverage/:coverageId", authenticate, requirePermission("cet.profiles_manage"), removeCoverageHandler);

// ============================================================
// Program-CET links
// ============================================================
const programLinks = Router();
programLinks.get("/:programId/exams", getProgramExamsHandler);
programLinks.post("/:programId/exams", authenticate, requirePermission("cet.programs_link"), linkProgramHandler);
programLinks.delete("/:programId/exams/:examId", authenticate, requirePermission("cet.programs_link"), unlinkProgramHandler);

// Mount routers
router.use("/universities", universities);
router.use("/exams", exams);
router.use("/profiles", profiles);
router.use("/programs", programLinks);

export { router as cetRoutes };
