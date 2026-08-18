/**
 * Client-side media preparation for uploads.
 *
 * Raster images are downscaled to a max dimension and re-encoded as WebP before
 * upload, so admins never ship a 10 MB PNG to students. Vector/animated files
 * (svg, gif) and non-images (pdf) are uploaded as-is.
 */

export interface UploadPayload {
  contentBase64: string;
  mimeType: string;
  filename: string;
}

const RASTER_OPTIMIZABLE = ["image/png", "image/jpeg", "image/webp"];

export async function fileToUploadPayload(file: File): Promise<UploadPayload> {
  const dataUrl = await readAsDataURL(file);
  return {
    contentBase64: dataUrl,
    mimeType: file.type || "application/octet-stream",
    filename: file.name,
  };
}

export async function prepareImageForUpload(
  file: File,
  opts: { maxDimension?: number; quality?: number } = {}
): Promise<UploadPayload> {
  const { maxDimension = 1600, quality = 0.82 } = opts;

  // Preserve vectors/animations and anything non-raster.
  if (!RASTER_OPTIMIZABLE.includes(file.type)) {
    return fileToUploadPayload(file);
  }

  try {
    const img = await loadImage(file);
    const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
    const targetW = Math.max(1, Math.round(img.width * scale));
    const targetH = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return fileToUploadPayload(file);
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const webp = canvas.toDataURL("image/webp", quality);
    if (webp.startsWith("data:image/webp")) {
      return { contentBase64: webp, mimeType: "image/webp", filename: replaceExt(file.name, "webp") };
    }
    // Browser without WebP encode support → fall back to JPEG.
    const jpeg = canvas.toDataURL("image/jpeg", quality);
    return { contentBase64: jpeg, mimeType: "image/jpeg", filename: replaceExt(file.name, "jpg") };
  } catch {
    return fileToUploadPayload(file);
  }
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

function replaceExt(name: string, ext: string): string {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  return `${base}.${ext}`;
}
