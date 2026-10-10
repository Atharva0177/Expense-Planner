import heic2any from "heic2any";

/**
 * Checks if a file is a HEIC / HEIF image by extension or MIME type.
 */

/** Converts a data URL to a Blob (for receipt attachments). */
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(";base64,");
  const mime = header.replace("data:", "") || "image/jpeg";
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export function isHeicFile(file: File): boolean {
  const fileName = (file.name || "").toLowerCase();
  const fileType = (file.type || "").toLowerCase();
  return (
    fileName.endsWith(".heic") ||
    fileName.endsWith(".heif") ||
    fileType === "image/heic" ||
    fileType === "image/heif" ||
    fileType === "image/heic-sequence" ||
    fileType === "image/heif-sequence"
  );
}

/**
 * Converts a HEIC/HEIF file or standard image to a JPEG base64 string and MIME type.
 * Also resizes oversized images to max 1600px to ensure fast transmission and Gemini OCR accuracy.
 * Returns the final JPEG blob too (used for receipt photo attachments).
 */
export async function processImageForOCR(
  file: File,
): Promise<{ imageBase64: string; mimeType: string; blob: Blob | null }> {
  let processedBlob: Blob = file;

  // Step 1: If HEIC/HEIF, convert to JPEG blob using heic2any
  if (isHeicFile(file)) {
    try {
      const conversionResult = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.85,
      });
      processedBlob = Array.isArray(conversionResult)
        ? conversionResult[0]
        : conversionResult;
    } catch (err) {
      console.warn("heic2any conversion fallback:", err);
      // fallback to original file if conversion failed
      processedBlob = file;
    }
  }

  // Step 2: Read blob as Data URL
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(processedBlob);
  });

  // Step 3: Resize through canvas if image is very large (e.g. 12MP+ phone photos)
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 1600;
      let width = img.width;
      let height = img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const resizedDataUrl = canvas.toDataURL("image/jpeg", 0.88);
        const [header, base64] = resizedDataUrl.split(";base64,");
        const mime = header.replace("data:", "") || "image/jpeg";
        const mime2 = header.replace("data:", "") || "image/jpeg";
        resolve({ imageBase64: base64, mimeType: mime2, blob: dataUrlToBlob(resizedDataUrl) });
        return;
      }

      // Fallback if canvas context fails
      const [header2, base64] = dataUrl.split(";base64,");
      const mime2 = header2.replace("data:", "") || "image/jpeg";
      resolve({ imageBase64: base64, mimeType: mime2, blob: dataUrlToBlob(dataUrl) });
    };

    img.onerror = () => {
      // Direct extraction fallback
      const [header3, base64] = dataUrl.split(";base64,");
      const mime3 = header3.replace("data:", "") || "image/jpeg";
      resolve({ imageBase64: base64, mimeType: mime3, blob: dataUrlToBlob(dataUrl) });
    };

    img.src = dataUrl;
  });
}

// Firestore doc limit is 1 MiB; keep the base64 payload well under it
// (base64 inflates binary by ~4/3), leaving room for the other fields.
const STORE_BUDGET_DATAURL = 800_000; // ~600KB binary

/**
 * Compresses an image blob into a base64 JPEG small enough to store as a
 * Firestore document (receipt attachments). Progressively reduces size and
 * quality until it fits; returns null when even the harshest attempt is too
 * big (extremely rare - canvas failures).
 */
export async function shrinkImageForStore(
  blob: Blob,
): Promise<{ base64: string; mimeType: string } | null> {
  const attempts: Array<{ maxDim: number; quality: number }> = [
    { maxDim: 1200, quality: 0.7 },
    { maxDim: 1000, quality: 0.55 },
    { maxDim: 900, quality: 0.45 },
    { maxDim: 700, quality: 0.35 },
  ];

  try {
    const bitmap = await createImageBitmap(blob);
    for (const a of attempts) {
      let width = bitmap.width;
      let height = bitmap.height;
      if (width > a.maxDim || height > a.maxDim) {
        if (width >= height) {
          height = Math.round((height * a.maxDim) / width);
          width = a.maxDim;
        } else {
          width = Math.round((width * a.maxDim) / height);
          height = a.maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(bitmap, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", a.quality);
      if (dataUrl.length <= STORE_BUDGET_DATAURL) {
        const [header, base64] = dataUrl.split(";base64,");
        return { base64, mimeType: "image/jpeg" };
      }
    }
    return null;
  } catch (err) {
    console.warn("shrinkImageForStore failed:", err);
    return null;
  }
}

