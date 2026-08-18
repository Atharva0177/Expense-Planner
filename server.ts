import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", environment: "React/Express/Firebase" });
  });

  app.post("/api/scan-receipt", async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "Missing image data" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ 
          error: "GEMINI_API_KEY is not configured in the server environment. Please set GEMINI_API_KEY in the settings." 
        });
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Normalize mimeType to standard IANA format supported by Gemini
      let normalizedMimeType = mimeType || "image/jpeg";
      if (!normalizedMimeType.startsWith("image/")) {
        normalizedMimeType = "image/jpeg";
      }

      // Models to try in order of capability & availability
      const candidateModels = [
        "gemini-2.5-flash",
        "gemini-flash-latest",
        "gemini-3.7-flash",
        "gemini-2.5-flash-lite"
      ];

      let lastError: any = null;
      let parsedResult: any = null;

      for (const modelName of candidateModels) {
        // Try up to 2 attempts per model for transient 503/429 spikes
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            if (attempt > 0) {
              await new Promise(resolve => setTimeout(resolve, 800));
            }

            const response = await ai.models.generateContent({
              model: modelName,
              contents: {
                parts: [
                  { inlineData: { data: imageBase64, mimeType: normalizedMimeType } },
                  { 
                    text: "Analyze this image of a purchase receipt, bill, invoice, or payment confirmation. Extract the total paid amount in numerical format (INR/₹ or standard currency), the transaction date (YYYY-MM-DD), the merchant or vendor name, and the best-fitting expense category (e.g. Food, Groceries, Shopping, Travel, Bills, Healthcare, Entertainment, Utilities, Education, or Other)." 
                  }
                ]
              },
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    amount: { type: Type.NUMBER, description: "Total amount on the receipt." },
                    date: { type: Type.STRING, description: "Date of the transaction in YYYY-MM-DD format." },
                    merchant: { type: Type.STRING, description: "Name of the merchant, store, or vendor." },
                    category: { type: Type.STRING, description: "One or two word category for this expense." }
                  },
                  required: ["amount", "date", "merchant", "category"]
                }
              }
            });

            let rawText = response.text || "{}";
            // Strip any markdown code formatting if present
            rawText = rawText.replace(/```json\s*/gi, "").replace(/```/g, "").trim();

            parsedResult = JSON.parse(rawText);
            if (parsedResult) {
              break; // Success!
            }
          } catch (err: any) {
            lastError = err;
            const errMsg = err?.message || String(err);
            const isTransient = errMsg.includes("503") || errMsg.includes("429") || errMsg.includes("high demand") || errMsg.includes("UNAVAILABLE");
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
        console.error("All candidate receipt scanning models failed:", lastError);
        const userFriendlyMsg = lastError?.message?.includes("503") || lastError?.message?.includes("high demand")
          ? "The receipt scanning AI service is temporarily experiencing high traffic. Please try again in a few seconds."
          : (lastError?.message || "Failed to process receipt with AI model");
        return res.status(500).json({ error: userFriendlyMsg });
      }

      res.json(parsedResult);
    } catch (error: any) {
      console.error("Receipt scan error:", error);
      res.status(500).json({ error: error.message || "Failed to process receipt with AI model" });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

