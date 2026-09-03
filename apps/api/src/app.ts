import { CORS_ORIGIN_LIST, applyApiSecurity } from "./lib/security-config";
import express from "express";
import cors from "cors";
import { authRoutes } from "./modules/auth/routes";
import { programRoutes } from "./modules/programs/routes";
import { subjectRoutes } from "./modules/subjects/routes";
import { curriculumRoutes } from "./modules/curriculum/routes";
import { moduleRoutes } from "./modules/modules/routes";
import { topicRoutes } from "./modules/topics/routes";
import { lessonRoutes } from "./modules/lessons/routes";
import { questionBankRoutes } from "./modules/question-bank/routes";
import { assessmentRoutes } from "./modules/assessments/routes";
import { passageRoutes } from "./modules/passages/routes";
import { cetRoutes } from "./modules/cet/routes";
import { mediaRoutes } from "./modules/media/routes";
import { UPLOAD_DIR } from "./modules/media/controller";
import { progressionRoutes } from "./modules/progression/routes";
import { settingsRoutes } from "./modules/settings/routes";
import { adminStatsRoutes } from "./modules/admin-stats/routes";
import { organizationRoutes } from "./modules/organizations/routes";
import { platformOrganizationsRoutes } from "./modules/platform/organizations/router";
import { enrollmentRoutes } from "./modules/enrollments/routes";
import { adminAuditRoutes } from "./modules/admin-audit/routes";
import contentVersionRoutes from "./modules/content-versions/routes";
import { accessControlRoutes } from "./modules/access-control/routes";
import { adminResetRoutes } from "./modules/platform/admin-reset/routes";
import { errorHandler } from "./middleware/error-handler";
import { resolveOrgContext } from "./middleware/org-context";

/**
 * Builds the fully-wired Express app without binding a port so it can be
 * reused by integration tests (supertest) and future serverless adapters.
 */
export function buildApp(): express.Express {
  const app = express();

  applyApiSecurity(app);
  app.use(cors({ origin: CORS_ORIGIN_LIST.length ? CORS_ORIGIN_LIST : true, credentials: true }));
  // Larger limit so base64 media uploads fit (15MB file ≈ 20MB base64); content endpoints stay small.
  app.use(express.json({ limit: "25mb" }));

  // Serve uploaded media files
  app.use("/uploads", express.static(UPLOAD_DIR));

  // Organization membership context: verifies the x-organization-id header
  // against server-side memberships (§44 — the header is never trusted).
  // MUST run BEFORE all route mounts: it opportunistically decodes the Bearer
  // token so org scoping also applies on public/list routes (not only routes
  // with per-route authenticate). No-op without the header or when anonymous.
  app.use(resolveOrgContext);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/programs", programRoutes);
  app.use("/programs", programRoutes); // Also accessible without /api prefix
  app.use("/api/subjects", subjectRoutes);
  app.use("/subjects", subjectRoutes); // Also accessible without /api prefix
  app.use("/api/curriculums", curriculumRoutes);
  app.use("/curriculums", curriculumRoutes); // Also accessible without /api prefix
  app.use("/api/modules", moduleRoutes);
  app.use("/modules", moduleRoutes); // Also accessible without /api prefix
  app.use("/api/topics", topicRoutes);
  app.use("/topics", topicRoutes); // Also accessible without /api prefix
  app.use("/api/lessons", lessonRoutes);
  app.use("/lessons", lessonRoutes); // Also accessible without /api prefix
  app.use("/api/questions", questionBankRoutes);
  app.use("/questions", questionBankRoutes); // Also accessible without /api prefix

  app.use("/api/assessments", assessmentRoutes);
  app.use("/assessments", assessmentRoutes); // Also accessible without /api prefix
  app.use("/api/passages", passageRoutes);
  app.use("/passages", passageRoutes); // Also accessible without /api prefix
  app.use("/api/cet", cetRoutes);
  app.use("/cet", cetRoutes); // Also accessible without /api prefix
  app.use("/api/media", mediaRoutes);
  app.use("/media", mediaRoutes); // Also accessible without /api prefix
  app.use("/api/progression", progressionRoutes);
  app.use("/progression", progressionRoutes); // Also accessible without /api prefix
  app.use("/api/settings", settingsRoutes);
  app.use("/settings", settingsRoutes); // Also accessible without /api prefix

  app.use("/api/admin-stats", adminStatsRoutes);
  app.use("/admin-stats", adminStatsRoutes); // Also accessible without /api prefix  app.use("/api/organizations", organizationRoutes);
  app.use("/organizations", organizationRoutes); // Also accessible without /api prefix

  // Enrollment management (CS#9 — additive; admin-side grant/list/update)
  app.use("/api", enrollmentRoutes);

    // Superadmin platform-management endpoints (§3 — superadmin-only, separate from /admin/*)  app.use("/api/platform/organizations", platformOrganizationsRoutes);

  // CS#26 — superadmin data resets (full-platform + per-organization; clean-slate testing/recovery tool)
  app.use("/api/platform/admin/reset", adminResetRoutes);

    // CS#14 — admin audit log (read-only query surface over append-only events).  app.use("/api/admin/audit", adminAuditRoutes);

  // CS#23.2 — Enterprise RBAC: role/permission matrix management + simulator.
  app.use("/api/admin/access", accessControlRoutes);

  // CS#10b — content versioning: draft / publish / rollback / history
  app.use("/api/versions", contentVersionRoutes);

  app.use(errorHandler);

  return app;
}