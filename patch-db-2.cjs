const fs = require("fs");
let code = fs.readFileSync("src/lib/db.ts", "utf8");

code = code.replace(
  'export async function addIncome(income: Omit<IncomeEntry, "id" | "created_at">): Promise<string> {',
  'export async function addIncome(income: Omit<IncomeEntry, "id" | "created_at">): Promise<string> {\n  const hhId = await getHhId(income.user_id);',
);
code = code.replace(
  "const payload = {",
  "const payload = {\n    household_id: hhId,",
);

fs.writeFileSync("src/lib/db.ts", code);
