import { processImageForOCR } from "./imageUtils";

export interface ParsedPayslip {
  month: string; // YYYY-MM
  basic: number;
  hra: number;
  special_allowance: number;
  bonus: number;
  other: number;
  epf_deduction: number;
  professional_tax: number;
  tds: number;
  net_credited: number;
}

/**
 * Sends a payslip / Form 16 page image to the backend parsing endpoint and
 * returns structured salary components matching the IncomeEntry schema.
 * Throws with a user-friendly message on failure.
 */
export async function parsePayslip(
  file: File,
): Promise<ParsedPayslip> {
  const { imageBase64, mimeType } = await processImageForOCR(file);

  const res = await fetch("/api/parse-payslip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64, mimeType }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error ||
        "Failed to parse the payslip. Please enter the values manually.",
    );
  }
  return data as ParsedPayslip;
}
