import { GoogleGenAI, Type } from "@google/genai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64 || !mimeType) {
      return res.status(400).json({ error: "Missing imageBase64 or mimeType" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is missing" });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: {
        parts: [
          { inlineData: { data: imageBase64, mimeType } },
          { text: "Extract the details from this receipt or invoice." },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: "Total amount on the receipt." },
            date: { type: Type.STRING, description: "Date of the transaction in YYYY-MM-DD format." },
            merchant: { type: Type.STRING, description: "Name of the merchant or a brief note describing the expense." },
            category: { type: Type.STRING, description: "A one word general category for this expense (e.g. Food, Groceries, Travel, Shopping, Bills)." },
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
    console.error("Receipt scan error:", error);
    return res.status(500).json({ error: error.message || "Failed to scan receipt" });
  }
}
