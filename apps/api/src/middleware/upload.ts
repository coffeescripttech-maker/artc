import multer from "multer";

/**
 * Multer storage configured for in-memory processing.
 * Files are kept as Buffers so the PDF text-extractors can operate
 * without writing anything to disk.
 */
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB cap
  },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype === "application/pdf") {
      callback(null, true);
    } else {
      callback(new Error("Only PDF files are supported"));
    }
  },
});
