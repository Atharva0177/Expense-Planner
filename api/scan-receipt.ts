import { GoogleGenAI, Type } from "@google/genai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

// Security: only well-known image mime types, and a hard cap on the payload.
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/gif",
]);
const MAX_BASE64_LENGTH = 10 * 1024 * 1024;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { imageBase64, mimeType } = req.body ?? {};
    if (!imageBase64 || !mimeType) {
      return res.status(400).json({ error: "Missing imageBase64 or mimeType" });
    }

    if (typeof imageBase64 !== "string" || imageBase64.length > MAX_BASE64_LENGTH) {
      return res.status(413).json({ error: "Image is too large" });
    }

    const normalizedMimeType =
      typeof mimeType === "string"
        ? mimeType.split(";")[0].trim().toLowerCase()
        : "";
    if (!ALLOWED_MIME_TYPES.has(normalizedMimeType)) {
      return res
        .status(415)
        .json({ error: "Unsupported image type. Use JPEG, PNG, WebP, HEIC, HEIF or GIF." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is missing" });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { data: imageBase64, mimeType: normalizedMimeType } },
          { text: "Extract the details from this receipt or invoice." },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: {
              type: Type.NUMBER,
              description: "Total amount on the receipt.",
            },
            date: {
              type: Type.STRING,
              description: "Date of the transaction in YYYY-MM-DD format.",
            },
            merchant: {
              type: Type.STRING,
              description:
                "Name of the merchant or a brief note describing the expense.",
            },
            category: {
              type: Type.STRING,
              description:
                "A one word general category for this expense (e.g. Food, Groceries, Travel, Shopping, Bills).",
            },
          },
          required: ["amount", "date", "merchant", "category"],
        },
      },
    });

    let result;
    try {
      result = JSON.parse(response.text || "{}");
    } catch (e) {
      return res.status(500).json({ error: "Failed to parse model response" });
    }

    return res.status(200).json(result);
  } catch (error: any) {
    // Log details server-side; return a generic message (no implementation leaks)
    console.error("Receipt scan error:", error);
    return res.status(500).json({ error: "Failed to process receipt with AI model" });
  }
}
