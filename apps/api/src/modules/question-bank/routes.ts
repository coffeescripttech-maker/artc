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
import {
  previewExtraction,
  previewExtractionSmart,
  previewExtractionStructured,
  previewExtractionMinerU,
  importQuestions,
} from "../question-import/service";
import { extractTextFromPdf } from "../utils/pdf";

const router: IRouter = Router();

// ============================================================
// Question Import routes — MUST come BEFORE /:id
// (Express matches /import before /:id="import")
// ============================================================

/** Roles allowed to import questions from PDF */
const importRoles = requireRole("super_admin", "school_admin", "content_admin", "teacher");

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
        return res.status(400).json({ error: { message: "No file uploaded", code: 400 } });
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
            message: err instanceof Error ? err.message : "Could not extract text from this PDF.",
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
 *
 * `mode` (multipart text field, default "smart"):
 *  - "smart":     PDF structure + original PDF attached to Gemini (vision).
 *                 Best quality — reads diagrams, scanned pages, formulas.
 *  - "budget":    PDF parsed locally (pdfjs ≈ PyMuPDF); only the structured
 *                 text/blocks/image-ids are sent to Gemini (text-only call).
 *                 Much cheaper — AI references images by id and the backend
 *                 attaches the real bounding boxes. Scanned pages are
 *                 detected and reported as warnings.
 *  - "mineru":    MinerU high-fidelity local parse (layout-aware Markdown,
 *                 OCR, HTML tables, LaTeX formulas, figure extraction with
 *                 captions) + text-only AI call. Best accuracy for
 *                 scanned/complex PDFs at Budget-mode cost. Requires MinerU
 *                 to be enabled server-side (MINERU_ENABLED).
 *  - "text":      Legacy plain-text mode (no file needed, vision only when
 *                 a file is attached).
 */
router.post(
  "/import/preview",
  authenticate,
  importRoles,
  upload.single("file"),
  async (req, res, next) => {
    try {
      // Multipart: pdfText/programName/subjectName/mode arrive as text fields,
      // file is the PDF (required for smart/budget, optional for plain).
      const pdfText = req.body.pdfText;
      const programName = req.body.programName || undefined;
      const subjectName = req.body.subjectName || undefined;
      const mode = (req.body.mode || "smart").toLowerCase();
      const pdfBuffer = req.file?.buffer;
      if (process.env.DEBUG_PDF === "1") {
        console.log(
          "[preview] mode:",
          mode,
          "pdfBuffer received:",
          pdfBuffer?.length,
          "bytes, pdfText:",
          pdfText?.length,
          "chars"
        );
      }

      let result;
      if (mode === "budget") {
        // Budget/structured mode: local parsing + text-only AI call.
        if (!pdfBuffer || pdfBuffer.length === 0) {
          return res.status(400).json({
            error: {
              message: "Budget mode requires the original PDF file to be attached.",
              code: 400,
            },
          });
        }
        result = await previewExtractionStructured(
          pdfBuffer,
          programName,
          subjectName,
          typeof pdfText === "string" ? pdfText : undefined
        );
      } else if (mode === "mineru") {
        // MinerU mode: high-fidelity local parse (OCR/tables/formulas/figures)
        // followed by a single text-only AI call.
        if (!pdfBuffer || pdfBuffer.length === 0) {
          return res.status(400).json({
            error: {
              message: "MinerU mode requires the original PDF file to be attached.",
              code: 400,
            },
          });
        }
        result = await previewExtractionMinerU(pdfBuffer, programName, subjectName);
      } else if (pdfBuffer && pdfBuffer.length > 0) {
        // Smart extraction: parses PDF structure (text blocks + image
        // bounding boxes), sends to Gemini with visual + structured context,
        // then renders only the specific image regions.
        result = await previewExtractionSmart(pdfBuffer, programName, subjectName);
      } else if (pdfText && typeof pdfText === "string") {
        result = await previewExtraction(pdfText, programName, subjectName);
      } else {
        return res.status(400).json({
          error: { message: "Either a PDF file or pdfText is required", code: 400 },
        });
      }

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
router.post("/import/bulk", authenticate, importRoles, async (req, res, next) => {
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
});

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
router.patch(
  "/links/:linkId",
  authenticate,
  requireRole("content_admin", "super_admin"),
  updateLink
);
router.delete(
  "/links/:linkId",
  authenticate,
  requireRole("content_admin", "super_admin"),
  removeLink
);

export { router as questionBankRoutes };
