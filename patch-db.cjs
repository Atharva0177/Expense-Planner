const fs = require('fs');
let code = fs.readFileSync('src/lib/db.ts', 'utf8');

code = code.replace(
  'import { db } from "./firebase";',
  'import { db } from "./firebase";\nimport { getHouseholdMembership } from "./db_household";\n\nasync function getHhId(userId: string) { const member = await getHouseholdMembership(userId); return member?.household_id; }\n'
);

// getTransactions
code = code.replace(
  'export async function getTransactions(userId: string, monthPrefix: string): Promise<Transaction[]> {',
  'export async function getTransactions(userId: string, monthPrefix: string): Promise<Transaction[]> {\n  const hhId = await getHhId(userId);\n'
);
code = code.replace(
  'where("user_id", "==", userId)',
  'where(hhId ? "household_id" : "user_id", "==", hhId || userId)'
);

// addTransaction
code = code.replace(
  'export async function addTransaction(transaction: Omit<Transaction, "id" | "created_at">): Promise<string> {',
  'export async function addTransaction(transaction: Omit<Transaction, "id" | "created_at">): Promise<string> {\n  const hhId = await getHhId(transaction.user_id);'
);
code = code.replace(
  'const payload = {',
  'const payload = {\n    household_id: hhId,'
);

// getIncomes
code = code.replace(
  'export async function getIncomes(userId: string, month: string): Promise<IncomeEntry[]> {',
  'export async function getIncomes(userId: string, month: string): Promise<IncomeEntry[]> {\n  const hhId = await getHhId(userId);'
);
code = code.replace(
  'where("user_id", "==", userId)',
  'where(hhId ? "household_id" : "user_id", "==", hhId || userId)'
);

// addIncomeEntry
code = code.replace(
  'export async function addIncomeEntry(payload: Omit<IncomeEntry, "id" | "created_at">): Promise<string> {',
  'export async function addIncomeEntry(payload: Omit<IncomeEntry, "id" | "created_at">): Promise<string> {\n  const hhId = await getHhId(payload.user_id);\n  payload = { ...payload, household_id: hhId } as any;'
);

// getBudgets
code = code.replace(
  'export async function getBudgets(userId: string, month: string): Promise<Budget[]> {',
  'export async function getBudgets(userId: string, month: string): Promise<Budget[]> {\n  const hhId = await getHhId(userId);'
);
code = code.replace(
  'where("user_id", "==", userId)',
  'where(hhId ? "household_id" : "user_id", "==", hhId || userId)'
);

// setBudget
code = code.replace(
  'export async function setBudget(budget: Omit<Budget, "id" | "created_at">): Promise<void> {',
  'export async function setBudget(budget: Omit<Budget, "id" | "created_at">): Promise<void> {\n  const hhId = await getHhId(budget.user_id);\n  budget = { ...budget, household_id: hhId } as any;'
);

// getRecurringRules
code = code.replace(
  'export async function getRecurringRules(userId: string): Promise<RecurringRule[]> {',
  'export async function getRecurringRules(userId: string): Promise<RecurringRule[]> {\n  const hhId = await getHhId(userId);'
);
code = code.replace(
  'where("user_id", "==", userId)',
  'where(hhId ? "household_id" : "user_id", "==", hhId || userId)'
);

// addRecurringRule
code = code.replace(
  'export async function addRecurringRule(rule: Omit<RecurringRule, "id" | "created_at">): Promise<string> {',
  'export async function addRecurringRule(rule: Omit<RecurringRule, "id" | "created_at">): Promise<string> {\n  const hhId = await getHhId(rule.user_id);'
);
code = code.replace(
  '...rule,',
  '...rule,\n    household_id: hhId,'
);

// getLoans
code = code.replace(
  'export async function getLoans(userId: string): Promise<Loan[]> {',
  'export async function getLoans(userId: string): Promise<Loan[]> {\n  const hhId = await getHhId(userId);'
);
code = code.replace(
  'where("user_id", "==", userId)',
  'where(hhId ? "household_id" : "user_id", "==", hhId || userId)'
);

// addLoan
code = code.replace(
  'export async function addLoan(loan: Omit<Loan, "id" | "created_at">): Promise<string> {',
  'export async function addLoan(loan: Omit<Loan, "id" | "created_at">): Promise<string> {\n  const hhId = await getHhId(loan.user_id);'
);
code = code.replace(
  '...loan,',
  '...loan,\n    household_id: hhId,'
);

// getLoanSchedule
code = code.replace(
  'export async function getLoanSchedule(loanId: string, userId: string): Promise<LoanSchedule[]> {',
  'export async function getLoanSchedule(loanId: string, userId: string): Promise<LoanSchedule[]> {\n  const hhId = await getHhId(userId);'
);
code = code.replace(
  'where("user_id", "==", userId)',
  'where(hhId ? "household_id" : "user_id", "==", hhId || userId)'
);

// saveLoanSchedule
code = code.replace(
  'export async function saveLoanSchedule(schedule: LoanSchedule[]): Promise<void> {',
  'export async function saveLoanSchedule(schedule: LoanSchedule[]): Promise<void> {\n  if (schedule.length === 0) return;\n  const hhId = await getHhId(schedule[0].user_id);\n  schedule = schedule.map(s => ({...s, household_id: hhId}));'
);

// getGoals
code = code.replace(
  'export async function getGoals(userId: string): Promise<Goal[]> {',
  'export async function getGoals(userId: string): Promise<Goal[]> {\n  const hhId = await getHhId(userId);'
);
code = code.replace(
  'where("user_id", "==", userId)',
  'where(hhId ? "household_id" : "user_id", "==", hhId || userId)'
);

// addGoal
code = code.replace(
  'export async function addGoal(goal: Omit<Goal, "id" | "created_at">): Promise<string> {',
  'export async function addGoal(goal: Omit<Goal, "id" | "created_at">): Promise<string> {\n  const hhId = await getHhId(goal.user_id);'
);
code = code.replace(
  '...goal,',
  '...goal,\n    household_id: hhId,'
);

// getTaxCalculations
code = code.replace(
  'export async function getTaxCalculations(userId: string): Promise<TaxCalculation[]> {',
  'export async function getTaxCalculations(userId: string): Promise<TaxCalculation[]> {\n  const hhId = await getHhId(userId);'
);
code = code.replace(
  'where("user_id", "==", userId)',
  'where(hhId ? "household_id" : "user_id", "==", hhId || userId)'
);

// saveTaxCalculation
code = code.replace(
  'export async function saveTaxCalculation(taxCalc: Omit<TaxCalculation, "id" | "created_at">): Promise<string> {',
  'export async function saveTaxCalculation(taxCalc: Omit<TaxCalculation, "id" | "created_at">): Promise<string> {\n  const hhId = await getHhId(taxCalc.user_id);\n  taxCalc = { ...taxCalc, household_id: hhId } as any;'
);

fs.writeFileSync('src/lib/db.ts', code);
