import { Request, Response, NextFunction } from "express";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { getAuthUserId } from "../../lib/validate";
import { ValidationError } from "../../lib/errors";

// Uploads are written next to the API process (apps/api/uploads) and served
// statically at /uploads. This is a local-disk v1; swap for object storage +
// CDN + on-the-fly variants (sharp) in a later phase without changing the API shape.
export const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

const ALLOWED_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
};

const MAX_BYTES = 15 * 1024 * 1024; // 15MB

export async function uploadMedia(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    getAuthUserId(req); // require an authenticated admin (route also checks role)

    const { contentBase64, mimeType, filename } = (req.body ?? {}) as {
      contentBase64?: unknown;
      mimeType?: unknown;
      filename?: unknown;
    };

    if (typeof contentBase64 !== "string" || !contentBase64) {
      throw new ValidationError("contentBase64 is required");
    }
    if (typeof mimeType !== "string" || !ALLOWED_MIME[mimeType]) {
      throw new ValidationError("Unsupported or missing file type");
    }

    // Accept raw base64 or a data URL (data:image/webp;base64,....)
    const base64 = contentBase64.includes(",")
      ? contentBase64.slice(contentBase64.indexOf(",") + 1)
      : contentBase64;

    const buffer = Buffer.from(base64, "base64");
    if (buffer.length === 0) throw new ValidationError("Empty file");
    if (buffer.length > MAX_BYTES) throw new ValidationError("File too large (max 15MB)");

    const ext = ALLOWED_MIME[mimeType];
    const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;

    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOAD_DIR, name), buffer);

    const base = process.env.API_URL || `${req.protocol}://${req.get("host")}`;
    const url = `${base.replace(/\/$/, "")}/uploads/${name}`;

    res.status(201).json({
      url,
      filename: typeof filename === "string" && filename ? filename : name,
      size: buffer.length,
      mimeType,
    });
  } catch (error) {
    next(error);
  }
}
