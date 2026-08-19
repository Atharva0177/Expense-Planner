// Cloudflare Pages / Workers Serverless Function for POST /api/scan-receipt
export interface CloudflareEnv {
  GEMINI_API_KEY?: string;
  [key: string]: any;
}

export async function onRequestPost(context: {
  request: Request;
  env: CloudflareEnv;
}) {
  const { request, env } = context;

  // CORS headers if needed
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    const apiKey =
      env.GEMINI_API_KEY ||
      (typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : "");
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error:
            "GEMINI_API_KEY environment variable is not configured in Cloudflare. Please go to Cloudflare Pages Dashboard -> Settings -> Environment Variables and add GEMINI_API_KEY.",
        }),
        { status: 500, headers },
      );
    }

    const { imageBase64, mimeType } = (await request.json()) as {
      imageBase64?: string;
      mimeType?: string;
    };
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "Missing image data in request" }),
        { status: 400, headers },
      );
    }

    let normalizedMimeType = mimeType || "image/jpeg";
    if (!normalizedMimeType.startsWith("image/")) {
      normalizedMimeType = "image/jpeg";
    }

    const candidateModels = [
      "gemini-2.5-flash",
      "gemini-flash-latest",
      "gemini-3.7-flash",
      "gemini-2.5-flash-lite",
    ];
    let parsedResult: any = null;
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
                      mimeType: normalizedMimeType,
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
          parsedResult = JSON.parse(cleanedText);
          if (parsedResult) break;
        } else {
          lastError = await res.json().catch(() => ({ status: res.status }));
        }
      } catch (e: any) {
        lastError = e;
      }
    }

    if (!parsedResult) {
      const errMsg =
        lastError?.error?.message ||
        "Failed to process receipt with Gemini model on Cloudflare.";
      return new Response(JSON.stringify({ error: errMsg }), {
        status: 500,
        headers,
      });
    }

    return new Response(JSON.stringify(parsedResult), { status: 200, headers });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers },
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
