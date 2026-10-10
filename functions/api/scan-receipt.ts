import { GoogleGenAI, Type } from "@google/genai";

// Security: only well-known image mime types, and a hard cap on the payload.
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/gif",
]);
const MAX_BASE64_LENGTH = 20 * 1024 * 1024;

export async function onRequestPost(context: any) {
  const { request, env } = context;

  try {
    const { imageBase64, mimeType } = await request.json();

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return new Response(JSON.stringify({ error: "Missing image data" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    if (imageBase64.length > MAX_BASE64_LENGTH) {
      return new Response(JSON.stringify({ error: "Image is too large" }), {
        status: 413,
        headers: {
          "Content-Type": "application/json",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    let normalizedMimeType =
      (typeof mimeType === "string" && mimeType) || "image/jpeg";
    normalizedMimeType = normalizedMimeType.split(";")[0].trim().toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(normalizedMimeType)) {
      return new Response(
        JSON.stringify({
          error: "Unsupported image type. Use JPEG, PNG, WebP, HEIC, HEIF or GIF.",
        }),
        {
          status: 415,
          headers: {
            "Content-Type": "application/json",
            "X-Content-Type-Options": "nosniff",
          },
        },
      );
    }

    if (!env.GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY not configured" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "X-Content-Type-Options": "nosniff",
          },
        },
      );
    }

    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    const models = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.5-flash-lite"];

    let lastError: any;
    for (const model of models) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          if (attempt > 0) await new Promise(r => setTimeout(r, 800));
          const response = await ai.models.generateContent({
            model,
            contents: { parts: [{ inlineData: { data: imageBase64, mimeType: normalizedMimeType } }, { text: "Analyze this receipt. Extract: amount (number), date (YYYY-MM-DD), merchant, category (Food, Groceries, Shopping, Travel, Bills, Healthcare, Entertainment, Utilities, Education, Other). Return JSON with keys: amount, date, merchant, category." }] },
            config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { amount: { type: Type.NUMBER }, date: { type: Type.STRING }, merchant: { type: Type.STRING }, category: { type: Type.STRING } }, required: ["amount", "date", "merchant", "category"] } },
          });

          const parsed = JSON.parse((response.text || "{}").replace(/```json\s*/gi, "").replace(/```/g, "").trim());
          if (parsed?.amount) {
            return new Response(JSON.stringify(parsed), {
              headers: {
                "Content-Type": "application/json",
                "X-Content-Type-Options": "nosniff",
              },
            });
          }
        } catch (err: any) {
          lastError = err;
          const msg = err?.message || String(err);
          if (!msg.includes("503") && !msg.includes("429") && !msg.includes("high demand")) break;
        }
      }
    }

    throw lastError || new Error("Failed to scan receipt");
  } catch (e: any) {
    // Log details server-side; return a generic message (no implementation leaks)
    console.error("scan-receipt error:", e?.message || e);
    const transient =
      String(e?.message || "").includes("503") ||
      String(e?.message || "").includes("high demand");
    return new Response(
      JSON.stringify({
        error: transient
          ? "The receipt scanning AI service is temporarily experiencing high traffic. Please try again in a few seconds."
          : "Failed to process receipt with AI model",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  }
}
