import { GoogleGenAI, Type } from "@google/genai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/gif",
]);
const MAX_BASE64_LENGTH = 10 * 1024 * 1024;

const PAYSLIP_PROMPT = [
  "You are a payslip and Form 16 data extraction engine. Read the attached salary slip / payslip image and extract these fields:",
  "- month: the salary period as YYYY-MM (if only 'October 2026' style is printed, convert; if unknown, use empty string).",
  "- basic: basic salary component for the period (number).",
  "- hra: house rent allowance component (number, 0 if absent).",
  "- special_allowance: special/other allowances (number, 0 if absent).",
  "- bonus: any bonus paid this period (number, 0 if absent).",
  "- other: any other earnings not covered above (number, 0 if absent).",
  "- epf_deduction: employee provident fund deduction (number, 0 if absent).",
  "- professional_tax: professional tax deduction (number, 0 if absent).",
  "- tds: income tax (TDS) deducted this period (number, 0 if absent).",
  "- net_credited: net amount credited / take-home for the period (number).",
  "Use per-period (usually monthly) values, NOT yearly projections. If a value shows yearly on a Form 16, divide by 12 and note nothing - just give monthly numbers.",
  "Return plain numbers without currency symbols or commas.",
].join(" ");

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { imageBase64, mimeType } = req.body ?? {};
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return res.status(400).json({ error: "Missing image data" });
    }
    if (imageBase64.length > MAX_BASE64_LENGTH) {
      return res.status(413).json({ error: "Image is too large" });
    }
    const normalizedMimeType =
      typeof mimeType === "string"
        ? mimeType.split(";")[0].trim().toLowerCase()
        : "";
    if (!ALLOWED_MIME_TYPES.has(normalizedMimeType)) {
      return res.status(415).json({
        error: "Unsupported image type. Use JPEG, PNG, WebP, HEIC, HEIF or GIF.",
      });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is missing" });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { data: imageBase64, mimeType: normalizedMimeType } },
          { text: PAYSLIP_PROMPT },
        ],
      },
      config: {
        responseMimeType: "application/json",
        temperature: 0,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            month: { type: Type.STRING, description: "Salary period as YYYY-MM, empty string if unknown" },
            basic: { type: Type.NUMBER, description: "Basic salary for the period" },
            hra: { type: Type.NUMBER, description: "HRA for the period" },
            special_allowance: { type: Type.NUMBER, description: "Special allowance for the period" },
            bonus: { type: Type.NUMBER, description: "Bonus for the period" },
            other: { type: Type.NUMBER, description: "Other earnings for the period" },
            epf_deduction: { type: Type.NUMBER, description: "EPF deducted for the period" },
            professional_tax: { type: Type.NUMBER, description: "Professional tax deducted" },
            tds: { type: Type.NUMBER, description: "TDS deducted for the period" },
            net_credited: { type: Type.NUMBER, description: "Net credited / take-home" },
          },
          required: [
            "month",
            "basic",
            "hra",
            "special_allowance",
            "bonus",
            "other",
            "epf_deduction",
            "professional_tax",
            "tds",
            "net_credited",
          ],
        },
      },
    });

    let result: any;
    try {
      const raw = (response.text || "{}")
        .replace(/```json\s*/gi, "")
        .replace(/```/g, "")
        .trim();
      result = JSON.parse(raw);
    } catch (e) {
      return res.status(500).json({ error: "Failed to parse model response" });
    }

    // Sanitize: numbers must be finite & non-negative; month must look right
    const num = (v: any) =>
      typeof v === "number" && isFinite(v) && v >= 0 ? v : 0;
    const month = typeof result.month === "string" ? result.month : "";
    const payload = {
      month: /^\d{4}-\d{2}$/.test(month) ? month : "",
      basic: num(result.basic),
      hra: num(result.hra),
      special_allowance: num(result.special_allowance),
      bonus: num(result.bonus),
      other: num(result.other),
      epf_deduction: num(result.epf_deduction),
      professional_tax: num(result.professional_tax),
      tds: num(result.tds),
      net_credited: num(result.net_credited),
    };

    if (payload.basic <= 0 && payload.net_credited <= 0) {
      return res
        .status(422)
        .json({ error: "No salary components could be read from this image" });
    }

    return res.status(200).json(payload);
  } catch (error: any) {
    console.error("Payslip parse error:", error);
    return res.status(500).json({ error: "Failed to process payslip with AI model" });
  }
}
