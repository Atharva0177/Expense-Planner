import heic2any from "heic2any";

/**
 * Checks if a file is a HEIC / HEIF image by extension or MIME type.
 */
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
 */
export async function processImageForOCR(
  file: File,
): Promise<{ imageBase64: string; mimeType: string }> {
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
        resolve({ imageBase64: base64, mimeType: mime });
        return;
      }

      // Fallback if canvas context fails
      const [header, base64] = dataUrl.split(";base64,");
      const mime = header.replace("data:", "") || "image/jpeg";
      resolve({ imageBase64: base64, mimeType: mime });
    };

    img.onerror = () => {
      // Direct extraction fallback
      const [header, base64] = dataUrl.split(";base64,");
      const mime = header.replace("data:", "") || "image/jpeg";
      resolve({ imageBase64: base64, mimeType: mime });
    };

    img.src = dataUrl;
  });
}
