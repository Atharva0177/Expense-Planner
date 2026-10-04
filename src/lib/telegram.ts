import { GoogleGenAI, Type } from "@google/genai";
import { addTransaction, getCategories } from "./db";
import { Transaction } from "../types";

export interface TelegramMessage {
  message_id: number;
  from: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username?: string;
    language_code?: string;
  };
  chat: {
    id: number;
    type: "private" | "group" | "supergroup" | "channel";
    title?: string;
    username?: string;
  };
  date: number;
  text?: string;
  photo?: Array<{
    file_id: string;
    file_unique_id: string;
    file_size: number;
    width: number;
    height: number;
  }>;
  document?: {
    file_id: string;
    file_unique_id: string;
    file_size: number;
    file_name?: string;
    mime_type?: string;
  };
  caption?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
}

export interface ParsedCommand {
  type: "expense" | "income" | "unknown";
  amount?: number;
  category?: string;
  note?: string;
  date?: string;
  payment_mode?: string;
}

const COMMAND_PATTERNS = {
  expense: /^\/(?:spent|spend|paid|bought|purchase)\s+(\d+(?:\.\d+)?)\s+(.+)$/i,
  income: /^\/(?:received|got|earned|income|salary)\s+(\d+(?:\.\d+)?)\s*(.*)$/i,
  help: /^\/(help|start)$/i,
};

export function parseCommand(text: string): ParsedCommand {
  const trimmed = text.trim();

  const expenseMatch = trimmed.match(COMMAND_PATTERNS.expense);
  if (expenseMatch) {
    const amount = parseFloat(expenseMatch[1]);
    const rest = expenseMatch[2].trim();

    const categoryMatch = rest.match(/^(\w+)(?:\s+(.*))?$/);
    const category = categoryMatch ? categoryMatch[1] : rest.split(" ")[0];
    const note = categoryMatch ? (categoryMatch[2] || "") : rest.substring(category.length).trim();

    return {
      type: "expense",
      amount,
      category: category.charAt(0).toUpperCase() + category.slice(1),
      note: note || undefined,
      date: new Date().toISOString().split("T")[0],
      payment_mode: "UPI",
    };
  }

  const incomeMatch = trimmed.match(COMMAND_PATTERNS.income);
  if (incomeMatch) {
    const amount = parseFloat(incomeMatch[1]);
    const note = incomeMatch[2]?.trim() || "Income";

    return {
      type: "income",
      amount,
      note,
      date: new Date().toISOString().split("T")[0],
    };
  }

  if (trimmed.match(COMMAND_PATTERNS.help)) {
    return { type: "unknown" };
  }

  return { type: "unknown" };
}

export async function scanReceiptWithGemini(
  imageBase64: string,
  mimeType: string,
  apiKey: string
): Promise<{ amount?: number; date?: string; merchant?: string; category?: string }> {
  const ai = new GoogleGenAI({ apiKey });

  const candidateModels = [
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-3.7-flash",
    "gemini-2.5-flash-lite",
  ];

  let lastError: any = null;

  for (const modelName of candidateModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 800));

        const response = await ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [
              { inlineData: { data: imageBase64, mimeType } },
              {
                text: "Analyze this receipt image. Extract: total amount (number), date (YYYY-MM-DD), merchant name, and expense category (Food, Groceries, Shopping, Travel, Bills, Healthcare, Entertainment, Utilities, Education, Other). Return strict JSON with keys: amount, date, merchant, category.",
              },
            ],
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                amount: { type: Type.NUMBER },
                date: { type: Type.STRING },
                merchant: { type: Type.STRING },
                category: { type: Type.STRING },
              },
              required: ["amount", "date", "merchant", "category"],
            },
          },
        });

        const rawText = (response.text || "{}")
          .replace(/```json\s*/gi, "")
          .replace(/```/g, "")
          .trim();
        const parsed = JSON.parse(rawText);
        if (parsed?.amount) return parsed;
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        const isTransient = msg.includes("503") || msg.includes("429") || msg.includes("high demand");
        if (!isTransient && attempt === 0) break;
      }
    }
  }
  throw lastError || new Error("Failed to scan receipt");
}

export async function getTelegramFile(fileId: string, botToken: string): Promise<{ filePath: string; fileSize: number }> {
  const url = `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.ok) throw new Error(data.description || "Failed to get file info");
  return { filePath: data.result.file_path, fileSize: data.result.file_size };
}

export async function downloadTelegramFile(filePath: string, botToken: string): Promise<Buffer> {
  const url = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to download file");
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function sendTelegramMessage(
  chatId: number,
  text: string,
  botToken: string,
  parseMode: "HTML" | "Markdown" | undefined = "HTML"
): Promise<void> {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
  });
}

export async function handleTelegramMessage(
  message: TelegramMessage,
  botToken: string,
  geminiApiKey: string
): Promise<void> {
  const chatId = message.chat.id;
  const userId = `telegram_${message.from.id}`;

  try {
    if (message.text) {
      const parsed = parseCommand(message.text);

      if (parsed.type === "expense" && parsed.amount) {
        const categories = await getCategories(userId);
        const matchedCat = categories.find(
          (c) => c.name.toLowerCase() === parsed.category?.toLowerCase()
        );
        const finalCategory = matchedCat?.name || parsed.category || "Other";

        await addTransaction({
          user_id: userId,
          category_id: finalCategory,
          amount: parsed.amount,
          date: parsed.date!,
          note: parsed.note || parsed.category || "Telegram entry",
          payment_mode: parsed.payment_mode || "UPI",
          source: "telegram",
        });

        await sendTelegramMessage(
          chatId,
          `✅ <b>Expense Logged</b>\n💰 Amount: ₹${parsed.amount}\n📂 Category: ${finalCategory}${parsed.note ? `\n📝 Note: ${parsed.note}` : ""}\n📅 Date: ${parsed.date}`,
          botToken
        );
        return;
      }

      if (parsed.type === "income" && parsed.amount) {
        await sendTelegramMessage(
          chatId,
          `📥 Income logging via Telegram not yet implemented. Use the app for income entries.`,
          botToken
        );
        return;
      }

      await sendTelegramMessage(
        chatId,
        `🤖 <b>Expense Planner Bot</b>\n\n<b>Commands:</b>\n/spent <amount> <category> [note] - Log expense\n/spent 50 coffee\n/spent 250 groceries big bazaar\n\n<b>Receipt Photos:</b> Forward any receipt image for auto-entry\n\n<b>Help:</b> /help`,
        botToken
      );
      return;
    }

    if (message.photo && message.photo.length > 0) {
      await sendTelegramMessage(chatId, "📸 Processing receipt...", botToken);

      const largestPhoto = message.photo.reduce((max, p) => p.file_size > max.file_size ? p : max);
      const { filePath } = await getTelegramFile(largestPhoto.file_id, botToken);
      const fileBuffer = await downloadTelegramFile(filePath, botToken);
      const imageBase64 = fileBuffer.toString("base64");
      const mimeType = "image/jpeg";

      const scanResult = await scanReceiptWithGemini(imageBase64, mimeType, geminiApiKey);

      if (scanResult.amount && scanResult.amount > 0) {
        const categories = await getCategories(userId);
        const matchedCat = categories.find(
          (c) => c.name.toLowerCase() === scanResult.category?.toLowerCase()
        );
        const finalCategory = matchedCat?.name || scanResult.category || "Other";

        await addTransaction({
          user_id: userId,
          category_id: finalCategory,
          amount: scanResult.amount,
          date: scanResult.date || new Date().toISOString().split("T")[0],
          note: scanResult.merchant || "Telegram receipt",
          payment_mode: "UPI",
          source: "telegram_receipt",
        });

        await sendTelegramMessage(
          chatId,
          `✅ <b>Receipt Scanned & Logged</b>\n💰 Amount: ₹${scanResult.amount}\n🏪 Merchant: ${scanResult.merchant || "Unknown"}\n📂 Category: ${finalCategory}\n📅 Date: ${scanResult.date || "Today"}`,
          botToken
        );
      } else {
        await sendTelegramMessage(chatId, "❌ Couldn't extract data from receipt. Please try a clearer photo.", botToken);
      }
      return;
    }

    if (message.document && message.document.mime_type?.startsWith("image/")) {
      await sendTelegramMessage(chatId, "📸 Processing receipt...", botToken);

      const { filePath } = await getTelegramFile(message.document.file_id, botToken);
      const fileBuffer = await downloadTelegramFile(filePath, botToken);
      const imageBase64 = fileBuffer.toString("base64");
      const mimeType = message.document.mime_type || "image/jpeg";

      const scanResult = await scanReceiptWithGemini(imageBase64, mimeType, geminiApiKey);

      if (scanResult.amount && scanResult.amount > 0) {
        const categories = await getCategories(userId);
        const matchedCat = categories.find(
          (c) => c.name.toLowerCase() === scanResult.category?.toLowerCase()
        );
        const finalCategory = matchedCat?.name || scanResult.category || "Other";

        await addTransaction({
          user_id: userId,
          category_id: finalCategory,
          amount: scanResult.amount,
          date: scanResult.date || new Date().toISOString().split("T")[0],
          note: scanResult.merchant || "Telegram receipt",
          payment_mode: "UPI",
          source: "telegram_receipt",
        });

        await sendTelegramMessage(
          chatId,
          `✅ <b>Receipt Scanned & Logged</b>\n💰 Amount: ₹${scanResult.amount}\n🏪 Merchant: ${scanResult.merchant || "Unknown"}\n📂 Category: ${finalCategory}\n📅 Date: ${scanResult.date || "Today"}`,
          botToken
        );
      } else {
        await sendTelegramMessage(chatId, "❌ Couldn't extract data from receipt. Please try a clearer photo.", botToken);
      }
      return;
    }

    await sendTelegramMessage(chatId, "📎 Send a receipt photo or use /spent <amount> <category>", botToken);
  } catch (error: any) {
    console.error("Telegram message handling error:", error);
    await sendTelegramMessage(chatId, `⚠️ Error: ${error.message}`, botToken);
  }
}

export async function setTelegramWebhook(botToken: string, webhookUrl: string): Promise<boolean> {
  const url = `https://api.telegram.org/bot${botToken}/setWebhook`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: webhookUrl, allowed_updates: ["message", "edited_message"] }),
  });
  const data = await res.json();
  return data.ok;
}

export async function deleteTelegramWebhook(botToken: string): Promise<boolean> {
  const url = `https://api.telegram.org/bot${botToken}/deleteWebhook`;
  const res = await fetch(url, { method: "POST" });
  const data = await res.json();
  return data.ok;
}

export function verifyTelegramWebhookSecret(
  secretToken: string,
  headerSecret: string | undefined
): boolean {
  return headerSecret === secretToken;
}