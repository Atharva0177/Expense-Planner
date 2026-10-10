import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

// ---------------------------------------------------------------------------
// Security helpers (dependency-free)
// ---------------------------------------------------------------------------

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/gif",
]);

// Base64 of a 25MB image is ~33.4M chars; cap well below the JSON body limit.
const MAX_BASE64_LENGTH = 20 * 1024 * 1024;

/** Simple in-memory fixed-window rate limiter (per IP + route bucket). */
function createRateLimiter(windowMs: number, max: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  const sweep = () => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  };
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const now = Date.now();
    if (hits.size > 10000) sweep();
    const key = `${req.ip ?? req.socket.remoteAddress ?? "unknown"}`;
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > max) {
      res.setHeader("Retry-After", Math.ceil((entry.resetAt - now) / 1000));
      res.status(429).json({ error: "Too many requests. Please slow down." });
      return;
    }
    next();
  };
}

const globalLimiter = createRateLimiter(15 * 60 * 1000, 300); // 300 / 15 min / IP
const scanLimiter = createRateLimiter(60 * 60 * 1000, 20); // 20 / hour / IP
const payslipLimiter = createRateLimiter(60 * 60 * 1000, 10); // 10 / hour / IP

/** Conservative security headers for all responses. */
function securityHeaders(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-XSS-Protection", "0"); // modern browsers: disabled legacy filter, CSP preferred
  res.setHeader(
    "Permissions-Policy",
    "camera=(self), microphone=(), geolocation=(), payment=()",
  );
  // The strict CSP breaks Vite's dev server (inline React-refresh preamble +
  // HMR websocket on a random port), so it only ships in production serving.
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' data: https://fonts.gstatic.com",
        "img-src 'self' data: blob:",
        "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://api.telegram.org wss://*.firebaseio.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join("; "),
    );
  }
  next();
}

const IS_PROD = process.env.NODE_ENV === "production";

/** Strip implementation details from errors in production responses. */
function safeErrorMessage(error: any): string {
  if (!IS_PROD) return error?.message || "Failed to process request";
  const msg = String(error?.message || "");
  if (msg.includes("503") || msg.includes("high demand")) {
    return "The receipt scanning AI service is temporarily experiencing high traffic. Please try again in a few seconds.";
  }
  return "Failed to process receipt with AI model";
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.set("trust proxy", 1);
  app.use(securityHeaders);
  app.use(globalLimiter);
  app.use(express.json({ limit: "25mb" }));

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", environment: "React/Express/Firebase" });
  });

  // Note: The Telegram bot now runs as an n8n workflow.
  // See n8n/README.md and n8n/expense-planner-bot.json.

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

  app.post("/api/parse-payslip", payslipLimiter, async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body ?? {};
      if (!imageBase64 || typeof imageBase64 !== "string") {
        return res.status(400).json({ error: "Missing image data" });
      }
      if (imageBase64.length > MAX_BASE64_LENGTH) {
        return res.status(413).json({ error: "Image is too large" });
      }
      let normalizedMimeType = (typeof mimeType === "string" && mimeType) || "image/jpeg";
      normalizedMimeType = normalizedMimeType.split(";")[0].trim().toLowerCase();
      if (!ALLOWED_MIME_TYPES.has(normalizedMimeType)) {
        return res.status(415).json({
          error: "Unsupported image type. Use JPEG, PNG, WebP, HEIC, HEIF or GIF.",
        });
      }
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: "GEMINI_API_KEY is not configured in the server environment.",
        });
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } },
      });

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

      const raw = (response.text || "{}")
        .replace(/```json\s*/gi, "")
        .replace(/```/g, "")
        .trim();
      const result = JSON.parse(raw);

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
        return res.status(422).json({
          error: "No salary components could be read from this image",
        });
      }

      res.json(payload);
    } catch (error: any) {
      console.error("Payslip parse error:", error);
      res.status(500).json({ error: safeErrorMessage(error) });
    }
  });

  app.post("/api/scan-receipt", scanLimiter, async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body ?? {};
      if (!imageBase64 || typeof imageBase64 !== "string") {
        return res.status(400).json({ error: "Missing image data" });
      }

      if (imageBase64.length > MAX_BASE64_LENGTH) {
        return res.status(413).json({ error: "Image is too large" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error:
            "GEMINI_API_KEY is not configured in the server environment. Please set GEMINI_API_KEY in the settings.",
        });
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      // Normalize mimeType to a whitelisted IANA type supported by Gemini
      let normalizedMimeType = (typeof mimeType === "string" && mimeType) || "image/jpeg";
      normalizedMimeType = normalizedMimeType.split(";")[0].trim().toLowerCase();
      if (!ALLOWED_MIME_TYPES.has(normalizedMimeType)) {
        return res.status(415).json({
          error: "Unsupported image type. Use JPEG, PNG, WebP, HEIC, HEIF or GIF.",
        });
      }

      // Models to try in order of capability & availability
      const candidateModels = [
        "gemini-2.5-flash",
        "gemini-flash-latest",
        "gemini-3.7-flash",
        "gemini-2.5-flash-lite",
      ];

      let lastError: any = null;
      let parsedResult: any = null;

      for (const modelName of candidateModels) {
        // Try up to 2 attempts per model for transient 503/429 spikes
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            if (attempt > 0) {
              await new Promise((resolve) => setTimeout(resolve, 800));
            }

            const response = await ai.models.generateContent({
              model: modelName,
              contents: {
                parts: [
                  {
                    inlineData: {
                      data: imageBase64,
                      mimeType: normalizedMimeType,
                    },
                  },
                  {
                    text: "Analyze this image of a purchase receipt, bill, invoice, or payment confirmation. Extract the total paid amount in numerical format (INR/₹ or standard currency), the transaction date (YYYY-MM-DD), the merchant or vendor name, and the best-fitting expense category (e.g. Food, Groceries, Shopping, Travel, Bills, Healthcare, Entertainment, Utilities, Education, or Other).",
                  },
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
                      description:
                        "Date of the transaction in YYYY-MM-DD format.",
                    },
                    merchant: {
                      type: Type.STRING,
                      description: "Name of the merchant, store, or vendor.",
                    },
                    category: {
                      type: Type.STRING,
                      description: "One or two word category for this expense.",
                    },
                  },
                  required: ["amount", "date", "merchant", "category"],
                },
              },
            });

            let rawText = response.text || "{}";
            // Strip any markdown code formatting if present
            rawText = rawText
              .replace(/```json\s*/gi, "")
              .replace(/```/g, "")
              .trim();

            parsedResult = JSON.parse(rawText);
            if (parsedResult) {
              break; // Success!
            }
          } catch (err: any) {
            lastError = err;
            const errMsg = err?.message || String(err);
            const isTransient =
              errMsg.includes("503") ||
              errMsg.includes("429") ||
              errMsg.includes("high demand") ||
              errMsg.includes("UNAVAILABLE");
            if (!isTransient && attempt === 0) {
              // Non-transient error, try next candidate model
              break;
            }
          }
        }

        if (parsedResult) {
          break;
        }
      }

      if (!parsedResult) {
        console.error(
          "All candidate receipt scanning models failed:",
          lastError,
        );
        return res.status(500).json({ error: safeErrorMessage(lastError) });
      }

      res.json(parsedResult);
    } catch (error: any) {
      console.error("Receipt scan error:", error);
      res.status(500).json({ error: safeErrorMessage(error) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
