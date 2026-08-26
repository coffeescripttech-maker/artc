import { Router, type IRouter } from "express";
import {
  list,
  getById,
  create,
  update,
  review,
  publish,
  archive,
  remove,
  createLink,
  updateLink,
  removeLink,
  bySubject,
  byTopic,
  byExam,
  byAssessment,
  stats,
  mine,
} from "./controller";
import { authenticate, requireRole } from "../../middleware/auth";
import { upload } from "../../middleware/upload";
import { previewExtraction, importQuestions } from "../question-import/service";
import { extractTextFromPdf } from "../utils/pdf";

const router: IRouter = Router();

// ============================================================
// Question Import routes — MUST come BEFORE /:id
// (Express matches /import before /:id="import")
// ============================================================

/** Roles allowed to import questions from PDF */
const importRoles = requireRole(
  "super_admin",
  "school_admin",
  "content_admin",
  "teacher"
);

/**
 * POST /questions/import/extract-text
 * Extract raw text from a PDF without calling Gemini.
 */
router.post(
  "/import/extract-text",
  authenticate,
  importRoles,
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ error: { message: "No file uploaded", code: 400 } });
      }

      // Basic PDF signature check — catches renamed non-PDF files early
      const magic = req.file.buffer.subarray(0, 5).toString("latin1");
      if (magic !== "%PDF-") {
        return res.status(400).json({
          error: {
            message: "This file is not a valid PDF.",
            code: 400,
          },
        });
      }

      let pdfText: string;
      try {
        pdfText = await extractTextFromPdf(req.file.buffer);
      } catch (err) {
        return res.status(422).json({
          error: {
            message:
              err instanceof Error
                ? err.message
                : "Could not extract text from this PDF.",
            code: 422,
          },
        });
      }

      if (!pdfText.trim()) {
        return res.status(422).json({
          error: {
            message:
              "No extractable text found in this PDF. It may be a scanned image — try a text-based PDF.",
            code: 422,
          },
        });
      }

      res.json({
        pdfText,
        programName: req.body.programName || null,
        subjectName: req.body.subjectName || null,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /questions/import/preview
 * Send extracted text to Gemini for structured question extraction.
 */
router.post(
  "/import/preview",
  authenticate,
  importRoles,
  async (req, res, next) => {
    try {
      const { pdfText, programName, subjectName } = req.body;
      if (!pdfText || typeof pdfText !== "string") {
        return res.status(400).json({
          error: { message: "pdfText is required", code: 400 },
        });
      }

      const result = await previewExtraction(pdfText, programName, subjectName);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /questions/import/bulk
 * Import reviewed questions into the question bank.
 */
router.post(
  "/import/bulk",
  authenticate,
  importRoles,
  async (req, res, next) => {
    try {
      if (!req.body.questions || !Array.isArray(req.body.questions)) {
        return res.status(400).json({
          error: { message: "questions array is required", code: 400 },
        });
      }
      if (!req.body.programId) {
        return res.status(400).json({
          error: { message: "programId is required", code: 400 },
        });
      }

      const result = await importQuestions({
        questions: req.body.questions,
        programId: req.body.programId,
        subjectId: req.body.subjectId ?? null,
        topicId: req.body.topicId ?? null,
        authorId: req.userId!,
      });

      res.status(201).json({
        message: `Imported ${result.created} questions`,
        created: result.created,
        skipped: result.skipped,
        errors: result.errors,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================
// Public routes (for published questions)
// ============================================================

router.get("/", list);
router.get("/mine", authenticate, mine);
router.get("/subject/:subjectId", bySubject);
router.get("/topic/:topicId", byTopic);
router.get("/exam/:examId", byExam);
router.get("/assessment/:assessmentId", byAssessment);
router.get("/stats", stats);

// ============================================================
// Parameterized routes — /:id comes last
// ============================================================

router.get("/:id", getById);

// Protected admin routes
router.post("/", authenticate, requireRole("content_admin", "super_admin"), create);
router.put("/:id", authenticate, requireRole("content_admin", "super_admin"), update);
router.patch("/:id/review", authenticate, requireRole("content_admin", "super_admin"), review);
router.patch("/:id/publish", authenticate, requireRole("content_admin", "super_admin"), publish);
router.patch("/:id/archive", authenticate, requireRole("content_admin", "super_admin"), archive);
router.delete("/:id", authenticate, requireRole("super_admin"), remove);

// Question links
router.post("/:id/links", authenticate, requireRole("content_admin", "super_admin"), createLink);
router.patch("/links/:linkId", authenticate, requireRole("content_admin", "super_admin"), updateLink);
router.delete("/links/:linkId", authenticate, requireRole("content_admin", "super_admin"), removeLink);

export { router as questionBankRoutes };
