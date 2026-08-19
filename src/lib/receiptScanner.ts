/**
 * Universal Receipt Scanning Utility
 * Supports Full-Stack Express Server, Cloudflare Pages Functions, and Client-Side Direct Fallback.
 */

export interface ReceiptScanResult {
  amount?: number;
  date?: string;
  merchant?: string;
  category?: string;
}

export async function scanReceiptWithFallback(
  imageBase64: string,
  mimeType: string,
): Promise<ReceiptScanResult> {
  const clientKey =
    (import.meta.env.VITE_GEMINI_API_KEY as string) ||
    (typeof window !== "undefined"
      ? localStorage.getItem("expense_planner_gemini_key")
      : null);

  // If a direct Gemini API key is configured (Vite env or saved in app), use direct scan
  if (clientKey && clientKey.trim()) {
    try {
      return await scanDirectlyWithGemini(
        imageBase64,
        mimeType,
        clientKey.trim(),
      );
    } catch (clientErr: any) {
      console.warn(
        "Direct Gemini scan failed, trying server API route:",
        clientErr,
      );
    }
  }

  // Otherwise, attempt the server route /api/scan-receipt (Express / Cloudflare Pages Function)
  let response: Response | null = null;
  try {
    response = await fetch("/api/scan-receipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64, mimeType }),
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }

    if (response.status === 405 || response.status === 404) {
      // Static host without backend API support
      if (clientKey) {
        return await scanDirectlyWithGemini(imageBase64, mimeType, clientKey);
      }
      throw new Error(
        "Static Hosting Detected (HTTP 405): POST /api/scan-receipt is not supported on this static server. Please click the 'API Key' button to enter your Gemini API key.",
      );
    }

    const errJson = await response.json().catch(() => ({}));
    throw new Error(
      errJson.error || `Server responded with status ${response.status}`,
    );
  } catch (err: any) {
    // If it was a network error or fetch failure and clientKey exists
    if (clientKey) {
      return await scanDirectlyWithGemini(imageBase64, mimeType, clientKey);
    }
    throw err;
  }
}

/**
 * Direct client-side Gemini fallback for static host environments
 */
async function scanDirectlyWithGemini(
  imageBase64: string,
  mimeType: string,
  apiKey: string,
): Promise<ReceiptScanResult> {
  const candidateModels = [
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-3.7-flash",
    "gemini-2.5-flash-lite",
  ];
  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType || "image/jpeg",
                    data: imageBase64,
                  },
                },
                {
                  text: "Analyze this image of a purchase receipt, bill, invoice, or payment confirmation. Extract the total paid amount in numerical format (INR/₹ or standard currency), the transaction date (YYYY-MM-DD), the merchant or vendor name, and the best-fitting expense category (e.g. Food, Groceries, Shopping, Travel, Bills, Healthcare, Entertainment, Utilities, Education, or Other). Respond strictly with valid JSON having the exact keys: amount (number), date (string), merchant (string), category (string).",
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      });

      if (res.ok) {
        const resData: any = await res.json();
        const rawText =
          resData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        const cleanedText = rawText
          .replace(/```json\s*/gi, "")
          .replace(/```/g, "")
          .trim();
        const parsed = JSON.parse(cleanedText);
        if (parsed) return parsed;
      } else {
        lastError = await res.json().catch(() => ({ status: res.status }));
      }
    } catch (e: any) {
      lastError = e;
    }
  }

  throw new Error(
    lastError?.error?.message ||
      "Failed to analyze receipt using direct Gemini API key.",
  );
}
