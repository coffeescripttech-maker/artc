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
import { authenticate, requireRole } from "../../middleware/auth";

const router: IRouter = Router();

// ============================================================
// Universities
// ============================================================
const universities = Router();
universities.get("/", listUniversitiesHandler);
universities.get("/:id", getUniversity);
universities.post("/", authenticate, requireRole("super_admin"), createUniversityHandler);
universities.put("/:id", authenticate, requireRole("super_admin"), updateUniversityHandler);
universities.delete("/:id", authenticate, requireRole("super_admin"), deleteUniversityHandler);

// ============================================================
// Exams
// ============================================================
const exams = Router();
exams.get("/", listExamsHandler);
exams.get("/:id", getExam);
exams.get("/:id/stats", examStats);
exams.post("/", authenticate, requireRole("content_admin", "super_admin"), createExamHandler);
exams.put("/:id", authenticate, requireRole("content_admin", "super_admin"), updateExamHandler);
exams.patch("/:id/publish", authenticate, requireRole("content_admin", "super_admin"), publishExamHandler);
exams.patch("/:id/archive", authenticate, requireRole("content_admin", "super_admin"), archiveExamHandler);
exams.delete("/:id", authenticate, requireRole("super_admin"), deleteExamHandler);

// ============================================================
// Profiles
// ============================================================
const profiles = Router();
profiles.get("/", listProfilesHandler);
profiles.get("/:id", getProfile);
profiles.get("/:id/stats", profileStats);
profiles.post("/", authenticate, requireRole("content_admin", "super_admin"), createProfileHandler);
profiles.put("/:id", authenticate, requireRole("content_admin", "super_admin"), updateProfileHandler);
profiles.patch("/:id/publish", authenticate, requireRole("content_admin", "super_admin"), publishProfileHandler);
profiles.patch("/:id/archive", authenticate, requireRole("content_admin", "super_admin"), archiveProfileHandler);
profiles.delete("/:id", authenticate, requireRole("super_admin"), deleteProfileHandler);

// Coverage routes (nested under profiles)
profiles.post("/:id/coverage", authenticate, requireRole("content_admin", "super_admin"), addCoverageHandler);
profiles.patch("/coverage/:coverageId", authenticate, requireRole("content_admin", "super_admin"), updateCoverageHandler);
profiles.delete("/coverage/:coverageId", authenticate, requireRole("content_admin", "super_admin"), removeCoverageHandler);

// ============================================================
// Program-CET links
// ============================================================
const programLinks = Router();
programLinks.get("/:programId/exams", getProgramExamsHandler);
programLinks.post("/:programId/exams", authenticate, requireRole("content_admin", "super_admin"), linkProgramHandler);
programLinks.delete("/:programId/exams/:examId", authenticate, requireRole("content_admin", "super_admin"), unlinkProgramHandler);

// Mount routers
router.use("/universities", universities);
router.use("/exams", exams);
router.use("/profiles", profiles);
router.use("/programs", programLinks);

export { router as cetRoutes };
