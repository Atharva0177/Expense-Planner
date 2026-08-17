import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", environment: "React/Express/Firebase" });
  });

  app.post("/api/scan-receipt", async (req, res) => {
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
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: {
          parts: [
            { inlineData: { data: imageBase64, mimeType } },
            { text: "Extract the details from this receipt or invoice." }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              amount: { type: Type.NUMBER, description: "Total amount on the receipt." },
              date: { type: Type.STRING, description: "Date of the transaction in YYYY-MM-DD format." },
              merchant: { type: Type.STRING, description: "Name of the merchant or a brief note describing the expense." },
              category: { type: Type.STRING, description: "A one word general category for this expense (e.g. Food, Groceries, Travel, Shopping, Bills)." }
            },
            required: ["amount", "date", "merchant", "category"]
          }
        }
      });

      let result;
      try {
        result = JSON.parse(response.text || "{}");
      } catch (e) {
        return res.status(500).json({ error: "Failed to parse model response" });
      }

      res.json(result);
    } catch (error: any) {
      console.error("Receipt scan error:", error);
      res.status(500).json({ error: error.message || "Failed to scan receipt" });
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

