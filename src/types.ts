export interface Category {
  id?: string;
  name: string;
  type: "fixed" | "custom";
  is_default: boolean;
  user_id?: string;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { name: "Rent", type: "fixed", is_default: true },
  { name: "EMI", type: "fixed", is_default: true },
  { name: "SIP/Investments", type: "fixed", is_default: true },
  { name: "Investments", type: "fixed", is_default: true },
  { name: "Mutual Funds", type: "fixed", is_default: true },
  { name: "Stocks", type: "fixed", is_default: true },
  { name: "Fixed Deposits", type: "fixed", is_default: true },
  { name: "Groceries", type: "fixed", is_default: true },
  { name: "Utilities", type: "fixed", is_default: true },
  { name: "Mobile Recharge", type: "fixed", is_default: true },
  { name: "Transport", type: "fixed", is_default: true },
  { name: "Dining Out", type: "fixed", is_default: true },
  { name: "Domestic Help", type: "fixed", is_default: true },
  { name: "Insurance Premium", type: "fixed", is_default: true },
  { name: "Medical", type: "fixed", is_default: true },
  { name: "Education", type: "fixed", is_default: true },
  { name: "Subscriptions", type: "fixed", is_default: true },
  { name: "Festivals & Gifts", type: "fixed", is_default: true },
  { name: "Travel", type: "fixed", is_default: true },
  { name: "Shopping", type: "fixed", is_default: true },
  { name: "Miscellaneous", type: "fixed", is_default: true }
];

export interface IncomeEntry {
  id?: string;
  user_id: string;
  household_id?: string;
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
  created_at?: Date;
}

export interface Transaction {
  id?: string;
  user_id: string;
  household_id?: string;
  category_id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  note: string;
  payment_mode: "UPI" | "Card" | "Cash" | "Netbanking" | "Other" | string;
  source: "manual" | "recurring" | "csv_import";
  created_at?: Date;
}

export interface Budget {
  id?: string;
  user_id: string;
  household_id?: string;
  scope?: "personal" | "household";
  category_id: string; // using category name as ID for now
  month: string; // YYYY-MM
  limit_amount: number;
  created_at?: Date;
}

export interface RecurringRule {
  id?: string;
  user_id: string;
  household_id?: string;
  category_id: string;
  amount: number;
  frequency: "monthly" | "quarterly" | "yearly";
  next_due_date: string; // YYYY-MM-DD
  label: string;
  active: boolean;
  created_at?: Date;
}

export interface Loan {
  id?: string;
  user_id: string;
  household_id?: string;
  principal: number;
  interest_rate: number; // annual percentage
  tenure_months: number;
  start_date: string; // YYYY-MM-DD
  emi_amount: number;
  created_at?: Date;
}

export interface LoanSchedule {
  id?: string;
  loan_id: string;
  user_id: string;
  household_id?: string;
  month_number: number;
  principal_component: number;
  interest_component: number;
  outstanding_balance: number;
  is_prepayment: boolean;
}

export interface Goal {
  id?: string;
  user_id: string;
  household_id?: string;
  name: string;
  target_amount: number;
  target_date: string; // YYYY-MM-DD
  current_amount: number;
  linked_recurring_rule_id?: string | null;
  created_at?: Date;
}

export interface TaxCalculation {
  id?: string;
  user_id: string;
  household_id?: string;
  financial_year: "2024-25" | "2025-26" | "2026-27" | string;
  assessment_year?: string;
  // Income components
  gross_salary: number;
  business_income?: number;
  rental_income?: number;
  interest_income?: number;
  other_income?: number;
  // Capital Gains
  stcg_equity?: number;
  ltcg_equity?: number;
  stcg_other?: number;
  ltcg_other?: number;
  // Deductions
  hra_exemption: number;
  standard_deduction: number;
  eighty_c: number;
  eighty_d: number;
  eighty_ccd_1b: number; // Self NPS
  eighty_ccd_2: number; // Employer NPS
  eighty_e?: number; // Education loan interest
  eighty_g?: number; // Donations
  eighty_tta_ttb?: number; // Savings interest
  home_loan_interest: number; // Sec 24b
  other_deductions: number;
  // Computed values
  old_regime_tax: number;
  new_regime_tax: number;
  old_regime_cess: number;
  new_regime_cess: number;
  old_regime_surcharge?: number;
  new_regime_surcharge?: number;
  old_regime_rebate?: number;
  new_regime_rebate?: number;
  recommended_regime: "old" | "new";
  breakeven_deduction?: number;
  // TDS & Advance Tax
  tds_deducted?: number;
  advance_tax_paid?: number;
  net_tax_payable_or_refund?: number;
  created_at?: Date;
}

// --- New Household Types ---

export interface Household {
  id?: string;
  name: string;
  created_by: string;
  created_at?: Date;
}

export interface HouseholdMember {
  id?: string;
  household_id: string;
  user_id: string;
  email: string;
  role: "primary" | "spouse" | "dependent" | "other" | string;
  custom_role_description?: string;
  joined_at?: Date;
}

export interface Invite {
  id?: string;
  household_id: string;
  email: string;
  invite_code: string;
  role?: "spouse" | "dependent" | "primary" | "other" | string;
  custom_role_description?: string;
  status: "pending" | "accepted" | "expired";
  expires_at: Date;
  created_at?: Date;
}

// --- New Investment Types ---

export interface InvestmentAccount {
  id?: string;
  user_id: string;
  household_id?: string;
  type: "mutual_fund" | "stock" | "fd" | "ppf" | "nps" | "gold" | "other" | string;
  custom_type_description?: string;
  name: string;
  folio_number?: string;
  created_at?: Date;
}

export interface InvestmentHolding {
  id?: string;
  investment_account_id: string;
  user_id: string;
  units?: number; // nullable for FD/PPF
  amount?: number; // for FD/PPF
  purchase_price: number; // For MF/Stock it's NAV/Price. For FD it's total principal.
  purchase_date: string; // YYYY-MM-DD
  created_at?: Date;
}

export interface InvestmentValuation {
  id?: string;
  investment_account_id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  price_or_nav: number;
  total_value: number;
  created_at?: Date;
}
