/**
 * Comprehensive Indian Income Tax & Financial Planning Engine
 *
 * VERIFIED AGAINST OFFICIAL SOURCES (Oct 2026):
 *  - Union Budget documents, Ministry of Finance (indiabudget.gov.in):
 *    Budget 2024-25 (slabs effective FY 2024-25), Budget 2025-26 (slabs
 *    effective FY 2025-26), Budget 2026-27 (no change to personal slabs).
 *  - Income Tax Act 1961 Sec 115BAC/87A/111A/112A (income earned up to
 *    31-Mar-2026) and Income Tax Act 2025 (effective 1-Apr-2026, FY 2026-27):
 *    slab rates unchanged from FY 2025-26; LTCG rate 13% under the 2025 Act.
 *  - Cross-checked with ClearTax's FY 2025-26 & FY 2026-27 slab guide
 *    (cleartax.in/s/income-tax-slabs) whose worked examples are reproduced in
 *    tests/taxUtils.test.ts as executable proof.
 *
 * New-regime slabs per FY:
 *  - FY 2024-25 (Budget 2024):      0-3L Nil | 3-7L 5% | 7-10L 10% | 10-12L
 *    15% | 12-15L 20% | >15L 30%. 87A: full rebate up to 7L taxable (+marginal
 *    relief). Std deduction 75,000.
 *  - FY 2025-26 (Budget 2025):     0-4L Nil | 4-8L 5% | 8-12L 10% | 12-16L
 *    15% | 16-20L 20% | 20-24L 25% | >24L 30%. 87A: rebate up to 60,000,
 *    zero tax up to 12L taxable (+marginal relief). Std deduction 75,000.
 *  - FY 2026-27 (Budget 2026 kept FY 2025-26 slabs; Income Tax Act 2025 in
 *    force): same slabs/rebate as FY 2025-26; LTCG special rate 13%
 *    (12.5% for FY 2024-25 & 2025-26).
 *
 * Old-regime slabs are unchanged across these FYs.
 */

export type FinancialYear = "2024-25" | "2025-26" | "2026-27";

interface NewRegimeConfig {
  /** [upperLimit, rate] pairs; last pair's upper limit is Infinity */
  slabs: Array<[number, number]>;
  /** Taxable income up to which Sec 87A rebates the whole slab tax */
  rebateLimit: number;
  /** Maximum rebate amount under Sec 87A */
  rebateMax: number;
  /** Special LTCG rate for the FY (12.5% under the 1961 Act, 13% under the 2025 Act) */
  ltcgRate: number;
}

export const NEW_REGIME_CONFIGS: Record<FinancialYear, NewRegimeConfig> = {
  "2024-25": {
    slabs: [
      [300000, 0],
      [700000, 0.05],
      [1000000, 0.1],
      [1200000, 0.15],
      [1500000, 0.2],
      [Infinity, 0.3],
    ],
    rebateLimit: 700000,
    rebateMax: 25000,
    ltcgRate: 0.125,
  },
  "2025-26": {
    slabs: [
      [400000, 0],
      [800000, 0.05],
      [1200000, 0.1],
      [1600000, 0.15],
      [2000000, 0.2],
      [2400000, 0.25],
      [Infinity, 0.3],
    ],
    rebateLimit: 1200000,
    rebateMax: 60000,
    ltcgRate: 0.125,
  },
  // Budget 2026: personal-tax slabs/deductions/rebate unchanged from FY 2025-26.
  // Income Tax Act 2025 (effective 1-Apr-2026) sets the LTCG special rate at 13%.
  "2026-27": {
    slabs: [
      [400000, 0],
      [800000, 0.05],
      [1200000, 0.1],
      [1600000, 0.15],
      [2000000, 0.2],
      [2400000, 0.25],
      [Infinity, 0.3],
    ],
    rebateLimit: 1200000,
    rebateMax: 60000,
    ltcgRate: 0.13,
  },
};

function resolveFY(financialYear?: string): FinancialYear {
  return financialYear === "2024-25" ||
    financialYear === "2025-26" ||
    financialYear === "2026-27"
    ? financialYear
    : "2024-25"; // conservative default preserves legacy behaviour
}

/** Applies progressive slab rates; returns tax + per-slab breakdown. */
function computeSlabTax(
  taxableIncome: number,
  slabs: Array<[number, number]>,
): { tax: number; breakdown: SlabBreakdown[] } {
  const breakdown: SlabBreakdown[] = [];
  let tax = 0;
  let lower = 0;
  for (const [upper, rate] of slabs) {
    if (taxableIncome <= lower) break;
    const inSlab = Math.min(taxableIncome, upper) - lower;
    const slabTax = inSlab * rate;
    tax += slabTax;
    const fmt = (n: number) =>
      Number.isFinite(n)
        ? `₹${(n / 100000).toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1")}L`
        : "Above ₹24,00,000";
    breakdown.push({
      slab: upper === Infinity ? "Above last slab" : `₹${(lower / 100000).toFixed(2).replace(/\.00$/, "")}L - ${fmt(upper)}`,
      rate: `${Math.round(rate * 100)}%`,
      taxableAmountInSlab: inSlab,
      tax: slabTax,
    });
    lower = upper;
  }
  if (breakdown.length === 0) {
    breakdown.push({
      slab: "₹0 - first slab",
      rate: "0%",
      taxableAmountInSlab: 0,
      tax: 0,
    });
  }
  return { tax, breakdown };
}

export interface SlabBreakdown {
  slab: string;
  rate: string;
  taxableAmountInSlab: number;
  tax: number;
}

export interface TaxBreakdown {
  regime: "new" | "old";
  financial_year: string;
  gross_income: number;
  salary_income: number;
  other_income: number;
  capital_gains_tax: number;
  total_deductions: number;
  deduction_breakdown: { [key: string]: number };
  taxable_income: number;
  slab_tax: number;
  slab_breakdown: SlabBreakdown[];
  rebate_87a: number;
  marginal_relief_87a: number;
  tax_after_rebate: number;
  surcharge: number;
  marginal_relief_surcharge: number;
  tax_after_surcharge: number;
  cess: number; // 4% Health & Education Cess
  total_tax: number;
  monthly_tax: number;
  monthly_take_home: number;
  effective_tax_rate: number;
}

export interface IndianTaxInputs {
  financial_year?: "2024-25" | "2025-26" | "2026-27" | string;
  age_category?: "general" | "senior" | "super_senior"; // <60, 60-80, >80

  // Income components
  gross_salary: number;
  basic_salary?: number;
  hra_received?: number;
  special_allowance?: number;
  bonus?: number;
  rental_income?: number;
  savings_interest?: number;
  fd_interest?: number;
  other_income?: number;

  // Capital Gains
  stcg_equity?: number; // Short term equity @ 20%
  ltcg_equity?: number; // Long term equity @ 12.5% > 1.25L
  stcg_slab?: number; // Debt/other STCG @ slab
  ltcg_other?: number; // Real estate/Gold LTCG @ 12.5%

  // Deductions for Old Regime
  is_salaried?: boolean;
  rent_paid?: number;
  is_metro?: boolean; // Mumbai, Delhi, Kolkata, Chennai (50% HRA)
  hra_exemption_override?: number;

  eighty_c?: number; // Max 1.5L (EPF, PPF, ELSS, LIC, Home Loan Principal, Tuition)
  eighty_ccd_1b?: number; // Max 50k (NPS self contribution)
  eighty_ccd_2?: number; // Employer NPS (Up to 14% Basic for New, 10% for Old)

  // 80D Health Insurance
  eighty_d_self?: number; // Self, spouse, children (Max 25k or 50k for senior)
  eighty_d_parents?: number; // Parents (Max 25k or 50k for senior parents)
  eighty_d_preventive?: number; // Up to 5k (within limits)

  home_loan_interest?: number; // Section 24b (Max 2L for self-occupied)
  eighty_e?: number; // Education loan interest
  eighty_g?: number; // Donations
  eighty_tta_ttb?: number; // Savings interest (Max 10k 80TTA or 50k 80TTB)
  other_deductions?: number; // LTA, Standard PT, etc.

  // Tax Paid / TDS
  tds_deducted?: number;
  advance_tax_paid?: number;
}

export interface AdvanceTaxInstallment {
  quarter: string;
  due_date: string;
  cumulative_percentage: number;
  quarter_amount_due: number;
  cumulative_amount_due: number;
  status: "upcoming" | "current" | "past";
}

export interface TaxComparisonResult {
  new_regime: TaxBreakdown;
  old_regime: TaxBreakdown;
  recommended_regime: "new" | "old";
  tax_difference: number;
  annual_savings: number;
  monthly_savings: number;
  breakeven_deductions: number;
  current_old_deductions: number;
  advance_tax_schedule: AdvanceTaxInstallment[];
  net_payable_or_refund: {
    recommended_tax: number;
    tds_deducted: number;
    advance_tax_paid: number;
    balance: number; // Positive = Payable, Negative = Refund Due
    is_refund: boolean;
  };
  capital_gains_summary: {
    total_gains: number;
    total_cg_tax: number;
    ltcg_exemption_used: number;
  };
  recommendations: string[];
}

/**
 * Section 10(13A) HRA Exemption Calculator as per Rule 2A
 */
export function calculateHRAExemption(
  basicSalary: number,
  hraReceived: number,
  annualRentPaid: number,
  isMetro: boolean = true,
): {
  exemptAmount: number;
  taxableHRA: number;
  metroPercentage: number;
  requiresLandlordPan: boolean;
  breakdown: {
    actualHRA: number;
    rentMinusTenPercentBasic: number;
    percentageOfBasic: number;
  };
} {
  const metroRate = isMetro ? 0.5 : 0.4;
  const percentageOfBasic = Math.max(0, basicSalary * metroRate);
  const tenPercentBasic = basicSalary * 0.1;
  const rentMinusTenPercentBasic = Math.max(
    0,
    annualRentPaid - tenPercentBasic,
  );

  const exemptAmount = Math.min(
    hraReceived,
    percentageOfBasic,
    rentMinusTenPercentBasic,
  );

  const taxableHRA = Math.max(0, hraReceived - exemptAmount);
  const requiresLandlordPan = annualRentPaid > 100000;

  return {
    exemptAmount: Math.round(exemptAmount),
    taxableHRA: Math.round(taxableHRA),
    metroPercentage: isMetro ? 50 : 40,
    requiresLandlordPan,
    breakdown: {
      actualHRA: hraReceived,
      rentMinusTenPercentBasic: Math.round(rentMinusTenPercentBasic),
      percentageOfBasic: Math.round(percentageOfBasic),
    },
  };
}

/**
 * Capital Gains Tax Engine
 * - LTCG equity: 12.5% above ₹1.25L exemption (Budget 2024 revision; the
 *   1961-Act rate applies to FY 2024-25 & FY 2025-26).
 * - From FY 2026-27 (Income Tax Act 2025, effective 1-Apr-2026): LTCG at 13%.
 * - STCG equity: 20% (Sec 111A, unchanged).
 * - Other LTCG (property/gold): same special rate as equity LTCG.
 */
export function calculateCapitalGainsTax(inputs: {
  stcg_equity?: number;
  ltcg_equity?: number;
  stcg_slab?: number;
  ltcg_other?: number;
  financial_year?: string;
}): {
  cg_tax: number;
  ltcg_equity_tax: number;
  stcg_equity_tax: number;
  ltcg_other_tax: number;
  ltcg_exemption_used: number;
  total_gains: number;
} {
  const stcgEq = Math.max(0, inputs.stcg_equity || 0);
  const ltcgEq = Math.max(0, inputs.ltcg_equity || 0);
  const ltcgOther = Math.max(0, inputs.ltcg_other || 0);

  const config = NEW_REGIME_CONFIGS[resolveFY(inputs.financial_year)];
  const ltcgRate = config.ltcgRate;

  // LTCG Equity: ₹1,25,000 exemption (Sec 112A / Sec 198 of the 2025 Act)
  const ltcgExemptionLimit = 125000;
  const ltcgExemptionUsed = Math.min(ltcgEq, ltcgExemptionLimit);
  const taxableLtcgEq = Math.max(0, ltcgEq - ltcgExemptionLimit);

  const ltcgEquityTax = taxableLtcgEq * ltcgRate;
  const stcgEquityTax = stcgEq * 0.2;
  const ltcgOtherTax = ltcgOther * ltcgRate;

  const totalCgTax = ltcgEquityTax + stcgEquityTax + ltcgOtherTax;
  const totalGains = stcgEq + ltcgEq + ltcgOther + (inputs.stcg_slab || 0);

  return {
    cg_tax: Math.round(totalCgTax),
    ltcg_equity_tax: Math.round(ltcgEquityTax),
    stcg_equity_tax: Math.round(stcgEquityTax),
    ltcg_other_tax: Math.round(ltcgOtherTax),
    ltcg_exemption_used: Math.round(ltcgExemptionUsed),
    total_gains: totalGains,
  };
}

/**
 * Calculate Marginal Relief on Surcharge (Section 2) for High Income Earners.
 * The surcharge on LTCG/STCG portions is capped at 15% (statutory cap).
 */
function calculateSurchargeWithMarginalRelief(
  taxableIncome: number,
  slabTax: number,
  cgTax: number,
  regime: "new" | "old",
  taxAtThreshold: (income: number) => number,
): { surcharge: number; marginal_relief: number; net_surcharge: number } {
  let rate = 0;
  let threshold = 0;

  if (taxableIncome > 50000000) {
    rate = regime === "new" ? 0.25 : 0.37; // new regime caps at 25%
    threshold = 50000000;
  } else if (taxableIncome > 20000000) {
    rate = 0.25;
    threshold = 20000000;
  } else if (taxableIncome > 10000000) {
    rate = 0.15;
    threshold = 10000000;
  } else if (taxableIncome > 5000000) {
    rate = 0.1;
    threshold = 5000000;
  } else {
    return { surcharge: 0, marginal_relief: 0, net_surcharge: 0 };
  }

  const cgRate = Math.min(rate, 0.15); // surcharge on capital gains capped at 15%
  const slabSurcharge = slabTax * rate;
  const cgSurcharge = cgTax * cgRate;
  const rawSurcharge = slabSurcharge + cgSurcharge;

  // Marginal relief (Sec 2): tax + surcharge payable must not exceed
  // (tax + surcharge at the threshold) + (income above the threshold).
  const thresholdSlabTax = taxAtThreshold(threshold);
  const thresholdSurcharge = thresholdSlabTax * rate;
  const maxAllowableTotal =
    thresholdSlabTax + thresholdSurcharge + cgSurcharge + (taxableIncome - threshold);
  const currentTotal = slabTax + cgTax + rawSurcharge;

  const marginalRelief =
    currentTotal > maxAllowableTotal ? currentTotal - maxAllowableTotal : 0;
  const netSurcharge = Math.max(0, rawSurcharge - marginalRelief);

  return {
    surcharge: Math.round(rawSurcharge),
    marginal_relief: Math.round(marginalRelief),
    net_surcharge: Math.round(netSurcharge),
  };
}

/**
 * Compute Tax under New Tax Regime (Section 115BAC - Default)
 * FY-aware: Budget 2024 slabs for FY 2024-25; Budget 2025 slabs for
 * FY 2025-26 & FY 2026-27 (Budget 2026 made no personal-tax changes).
 */
export function calculateNewRegimeDetails(
  inputs: IndianTaxInputs,
): TaxBreakdown {
  const fy = resolveFY(inputs.financial_year);
  const config = NEW_REGIME_CONFIGS[fy];
  const isSalaried = inputs.is_salaried !== false;
  const standardDeduction = isSalaried ? 75000 : 0;

  // NPS 80CCD(2) Employer contribution: up to 14% of Basic + DA under New Regime
  const basicSalary = inputs.basic_salary || inputs.gross_salary * 0.5;
  const max80CCD2 = basicSalary * 0.14;
  const eightyCCD2 = Math.min(inputs.eighty_ccd_2 || 0, max80CCD2);

  const deductions: { [key: string]: number } = {
    "Standard Deduction (Sec 16(ia))": standardDeduction,
  };
  if (eightyCCD2 > 0) {
    deductions["Employer NPS (Sec 80CCD(2)) - 14%"] = Math.round(eightyCCD2);
  }

  const totalDeductions = standardDeduction + eightyCCD2;

  const otherIncome =
    (inputs.rental_income || 0) +
    (inputs.savings_interest || 0) +
    (inputs.fd_interest || 0) +
    (inputs.other_income || 0) +
    (inputs.stcg_slab || 0);

  const grossIncome = inputs.gross_salary + otherIncome;
  const taxableNormalIncome = Math.max(0, grossIncome - totalDeductions);

  // Slab computation (FY-specific slabs)
  const { tax: slabTaxRaw, breakdown: slabBreakdown } = computeSlabTax(
    taxableNormalIncome,
    config.slabs,
  );

  // Section 87A Rebate & Marginal Relief (FY-specific limit/max):
  //  - taxable <= rebateLimit: rebate = min(slabTax, rebateMax)
  //  - taxable > rebateLimit: marginal relief caps the tax at (taxable - rebateLimit)
  let slabTax = slabTaxRaw;
  let rebate87A = 0;
  let marginalRelief87A = 0;

  if (taxableNormalIncome <= config.rebateLimit) {
    rebate87A = Math.min(slabTax, config.rebateMax);
    slabTax = slabTaxRaw - rebate87A;
  } else {
    // Marginal relief: tax payable cannot exceed income above the rebate limit
    const excessIncome = taxableNormalIncome - config.rebateLimit;
    if (slabTaxRaw > excessIncome) {
      marginalRelief87A = slabTaxRaw - excessIncome;
      slabTax = excessIncome;
    }
  }

  // Capital Gains Tax (FY-aware special rates; 87A rebate does NOT apply to
  // income taxed at special rates)
  const cgResult = calculateCapitalGainsTax(inputs);
  const totalBaseTax = slabTax + cgResult.cg_tax;

  // Surcharge calculation (LTCG portion capped at 15%)
  const totalIncomeForSurcharge = taxableNormalIncome + cgResult.total_gains;
  const surchargeInfo = calculateSurchargeWithMarginalRelief(
    totalIncomeForSurcharge,
    slabTax,
    cgResult.cg_tax,
    "new",
    (income: number) => computeSlabTax(income, config.slabs).tax,
  );
  const taxAfterSurcharge = totalBaseTax + surchargeInfo.net_surcharge;

  // 4% Health & Education Cess
  const cess = taxAfterSurcharge * 0.04;
  const totalTax = Math.round(taxAfterSurcharge + cess);

  const monthlyTax = Math.round(totalTax / 12);
  const monthlyTakeHome = Math.round(
    (grossIncome + cgResult.total_gains - totalTax) / 12,
  );
  const totalTaxableBase = taxableNormalIncome + cgResult.total_gains;
  const effectiveRate =
    totalTaxableBase > 0
      ? (totalTax / (grossIncome + cgResult.total_gains)) * 100
      : 0;

  return {
    regime: "new",
    financial_year: fy,
    gross_income: grossIncome,
    salary_income: inputs.gross_salary,
    other_income: otherIncome,
    capital_gains_tax: cgResult.cg_tax,
    total_deductions: totalDeductions,
    deduction_breakdown: deductions,
    taxable_income: taxableNormalIncome,
    slab_tax: Math.round(slabTax),
    slab_breakdown: slabBreakdown,
    rebate_87a: Math.round(rebate87A),
    marginal_relief_87a: Math.round(marginalRelief87A),
    tax_after_rebate: Math.round(slabTax),
    surcharge: surchargeInfo.surcharge,
    marginal_relief_surcharge: surchargeInfo.marginal_relief,
    tax_after_surcharge: Math.round(taxAfterSurcharge),
    cess: Math.round(cess),
    total_tax: totalTax,
    monthly_tax: monthlyTax,
    monthly_take_home: monthlyTakeHome,
    effective_tax_rate: Number(effectiveRate.toFixed(2)),
  };
}

/**
 * Compute Tax under Old Tax Regime (Optional Regime with all exemptions)
 */
export function calculateOldRegimeDetails(
  inputs: IndianTaxInputs,
): TaxBreakdown {
  const isSalaried = inputs.is_salaried !== false;
  const standardDeduction = isSalaried ? 50000 : 0;
  const basicSalary = inputs.basic_salary || inputs.gross_salary * 0.5;

  // 1. HRA Exemption
  let hraExemption = 0;
  if (
    inputs.hra_exemption_override !== undefined &&
    inputs.hra_exemption_override > 0
  ) {
    hraExemption = inputs.hra_exemption_override;
  } else if (inputs.hra_received && inputs.rent_paid) {
    const hraCalc = calculateHRAExemption(
      basicSalary,
      inputs.hra_received,
      inputs.rent_paid,
      inputs.is_metro,
    );
    hraExemption = hraCalc.exemptAmount;
  }

  // 2. Section 80C (Capped at 1.5 Lakhs)
  const capped80C = Math.min(150000, Math.max(0, inputs.eighty_c || 0));

  // 3. Section 80CCD(1B) Self NPS (Capped at 50,000)
  const capped80CCD1B = Math.min(50000, Math.max(0, inputs.eighty_ccd_1b || 0));

  // 4. Section 80CCD(2) Employer NPS (Capped at 10% of Basic for Old Regime)
  const max80CCD2 = basicSalary * 0.1;
  const capped80CCD2 = Math.min(
    max80CCD2,
    Math.max(0, inputs.eighty_ccd_2 || 0),
  );

  // 5. Section 80D Health Insurance
  // Self/Family limit: 25k (general) or 50k (senior)
  const selfLimit =
    inputs.age_category === "senior" || inputs.age_category === "super_senior"
      ? 50000
      : 25000;
  const parentsLimit = 50000; // Parents senior default up to 50k
  const eightyDSelf = Math.min(
    selfLimit,
    (inputs.eighty_d_self || 0) +
      Math.min(5000, inputs.eighty_d_preventive || 0),
  );
  const eightyDParents = Math.min(parentsLimit, inputs.eighty_d_parents || 0);
  const total80D = eightyDSelf + eightyDParents;

  // 6. Section 24(b) Home Loan Interest (Capped at 2 Lakhs for Self-occupied)
  const cappedHomeLoan = Math.min(
    200000,
    Math.max(0, inputs.home_loan_interest || 0),
  );

  // 7. Section 80E (Education Loan - No Limit)
  const eightyE = Math.max(0, inputs.eighty_e || 0);

  // 8. Section 80G (Donations)
  const eightyG = Math.max(0, inputs.eighty_g || 0);

  // 9. Section 80TTA / 80TTB (Savings interest up to 10k/50k)
  const savingsCap =
    inputs.age_category === "senior" || inputs.age_category === "super_senior"
      ? 50000
      : 10000;
  const eightyTTA = Math.min(
    savingsCap,
    inputs.eighty_tta_ttb || inputs.savings_interest || 0,
  );

  // 10. Other deductions (Professional Tax, LTA, 80GG, etc.)
  const otherDeductions = Math.max(0, inputs.other_deductions || 0);

  const deductionMap: { [key: string]: number } = {
    "Standard Deduction": standardDeduction,
  };
  if (hraExemption > 0)
    deductionMap["HRA Exemption (Sec 10(13A))"] = Math.round(hraExemption);
  if (capped80C > 0)
    deductionMap["Section 80C (PPF/EPF/ELSS/LIC)"] = Math.round(capped80C);
  if (capped80CCD1B > 0)
    deductionMap["NPS Self Contribution (Sec 80CCD(1B))"] =
      Math.round(capped80CCD1B);
  if (capped80CCD2 > 0)
    deductionMap["Employer NPS (Sec 80CCD(2)) - 10%"] =
      Math.round(capped80CCD2);
  if (total80D > 0)
    deductionMap["Health Insurance (Sec 80D)"] = Math.round(total80D);
  if (cappedHomeLoan > 0)
    deductionMap["Home Loan Interest (Sec 24b)"] = Math.round(cappedHomeLoan);
  if (eightyE > 0)
    deductionMap["Education Loan Interest (Sec 80E)"] = Math.round(eightyE);
  if (eightyG > 0) deductionMap["Donations (Sec 80G)"] = Math.round(eightyG);
  if (eightyTTA > 0)
    deductionMap["Savings Interest Deduction (80TTA/TTB)"] =
      Math.round(eightyTTA);
  if (otherDeductions > 0)
    deductionMap["Other Deductions (PT / LTA / 80GG)"] =
      Math.round(otherDeductions);

  const totalDeductions =
    standardDeduction +
    hraExemption +
    capped80C +
    capped80CCD1B +
    capped80CCD2 +
    total80D +
    cappedHomeLoan +
    eightyE +
    eightyG +
    eightyTTA +
    otherDeductions;

  const otherIncome =
    (inputs.rental_income || 0) +
    (inputs.savings_interest || 0) +
    (inputs.fd_interest || 0) +
    (inputs.other_income || 0) +
    (inputs.stcg_slab || 0);

  const grossIncome = inputs.gross_salary + otherIncome;
  const taxableNormalIncome = Math.max(0, grossIncome - totalDeductions);

  // Slabs for Old Regime:
  // General (<60 yrs): 0-2.5L Nil, 2.5L-5L 5%, 5L-10L 20%, Above 10L 30%
  // Senior (60-80 yrs): 0-3L Nil, 3L-5L 5%, 5L-10L 20%, Above 10L 30%
  // Super Senior (>80 yrs): 0-5L Nil, 5L-10L 20%, Above 10L 30%
  let exemptionLimit = 250000;
  if (inputs.age_category === "senior") exemptionLimit = 300000;
  if (inputs.age_category === "super_senior") exemptionLimit = 500000;

  const slabBreakdown: SlabBreakdown[] = [];
  let slabTax = 0;

  // Slab 1: Exemption limit (0%)
  const s1Amount = Math.min(taxableNormalIncome, exemptionLimit);
  slabBreakdown.push({
    slab: `₹0 - ₹${(exemptionLimit / 100000).toFixed(1)}L`,
    rate: "0%",
    taxableAmountInSlab: s1Amount,
    tax: 0,
  });

  // Slab 2: Exemption to 5,00,000 (5%)
  if (taxableNormalIncome > exemptionLimit) {
    const s2Amount = Math.min(
      500000 - exemptionLimit,
      taxableNormalIncome - exemptionLimit,
    );
    const s2Tax = s2Amount * 0.05;
    slabTax += s2Tax;
    slabBreakdown.push({
      slab: `₹${(exemptionLimit / 100000).toFixed(1)}L - ₹5,00,000`,
      rate: "5%",
      taxableAmountInSlab: s2Amount,
      tax: s2Tax,
    });
  }

  // Slab 3: 5,00,001 to 10,00,000 (20%)
  if (taxableNormalIncome > 500000) {
    const s3Amount = Math.min(500000, taxableNormalIncome - 500000);
    const s3Tax = s3Amount * 0.2;
    slabTax += s3Tax;
    slabBreakdown.push({
      slab: "₹5,00,001 - ₹10,00,000",
      rate: "20%",
      taxableAmountInSlab: s3Amount,
      tax: s3Tax,
    });
  }

  // Slab 4: Above 10,00,000 (30%)
  if (taxableNormalIncome > 1000000) {
    const s4Amount = taxableNormalIncome - 1000000;
    const s4Tax = s4Amount * 0.3;
    slabTax += s4Tax;
    slabBreakdown.push({
      slab: "Above ₹10,00,000",
      rate: "30%",
      taxableAmountInSlab: s4Amount,
      tax: s4Tax,
    });
  }

  // Rebate under Section 87A (Old Regime: Up to ₹12,500 if income <= 5L)
  let rebate87A = 0;
  if (taxableNormalIncome <= 500000) {
    rebate87A = slabTax;
    slabTax = 0;
  }

  // Capital Gains Tax
  const cgResult = calculateCapitalGainsTax(inputs);
  const totalBaseTax = slabTax + cgResult.cg_tax;

  // Surcharge Calculation (Old regime top rate is 37% for > 5Cr; LTCG portion capped at 15%)
  const totalIncomeForSurcharge = taxableNormalIncome + cgResult.total_gains;
  const surchargeInfo = calculateSurchargeWithMarginalRelief(
    totalIncomeForSurcharge,
    slabTax,
    cgResult.cg_tax,
    "old",
    (income: number) => {
      // Old-regime slab tax at a given income (general category)
      const limit = exemptionLimit;
      if (income <= limit) return 0;
      let t = Math.min(500000 - limit, income - limit) * 0.05;
      if (income > 500000) t += Math.min(500000, income - 500000) * 0.2;
      if (income > 1000000) t += (income - 1000000) * 0.3;
      return t;
    },
  );
  const taxAfterSurcharge = totalBaseTax + surchargeInfo.net_surcharge;

  // 4% Health & Education Cess
  const cess = taxAfterSurcharge * 0.04;
  const totalTax = Math.round(taxAfterSurcharge + cess);

  const monthlyTax = Math.round(totalTax / 12);
  const monthlyTakeHome = Math.round(
    (grossIncome + cgResult.total_gains - totalTax) / 12,
  );
  const totalTaxableBase = taxableNormalIncome + cgResult.total_gains;
  const effectiveRate =
    totalTaxableBase > 0
      ? (totalTax / (grossIncome + cgResult.total_gains)) * 100
      : 0;

  return {
    regime: "old",
    financial_year: inputs.financial_year || "2024-25",
    gross_income: grossIncome,
    salary_income: inputs.gross_salary,
    other_income: otherIncome,
    capital_gains_tax: cgResult.cg_tax,
    total_deductions: totalDeductions,
    deduction_breakdown: deductionMap,
    taxable_income: taxableNormalIncome,
    slab_tax: Math.round(slabTax),
    slab_breakdown: slabBreakdown,
    rebate_87a: Math.round(rebate87A),
    marginal_relief_87a: 0,
    tax_after_rebate: Math.round(slabTax),
    surcharge: surchargeInfo.surcharge,
    marginal_relief_surcharge: surchargeInfo.marginal_relief,
    tax_after_surcharge: Math.round(taxAfterSurcharge),
    cess: Math.round(cess),
    total_tax: totalTax,
    monthly_tax: monthlyTax,
    monthly_take_home: monthlyTakeHome,
    effective_tax_rate: Number(effectiveRate.toFixed(2)),
  };
}

/**
 * Calculate Breakeven Deductions:
 * The total deductions required in the Old Regime to match the New Regime's
 * tax liability. FY-aware: the zero-tax boundary is 7.75L gross for
 * FY 2024-25 and 12.75L gross for FY 2025-26 / 2026-27.
 */
export function calculateBreakevenDeductions(
  grossIncome: number,
  financialYear?: string,
): number {
  const fy = resolveFY(financialYear);
  const config = NEW_REGIME_CONFIGS[fy];
  const zeroTaxGross = config.rebateLimit + 75000; // rebate limit + std deduction

  if (grossIncome <= zeroTaxGross) {
    // Under New Regime the tax is zero; in Old Regime you need deductions to
    // bring income below 5L (or match zero tax).
    return Math.max(0, grossIncome - 500000);
  }

  // Binary search for exact deduction where Old Tax == New Tax
  const newRegimeTax = calculateNewRegimeDetails({
    gross_salary: grossIncome,
    financial_year: fy,
  }).total_tax;

  let low = 0;
  let high = grossIncome;
  let bestDeduction = 0;

  for (let i = 0; i < 25; i++) {
    const mid = (low + high) / 2;
    // Test Old regime with standard deduction + mid
    const testTax = calculateOldRegimeDetails({
      gross_salary: grossIncome,
      other_deductions: Math.max(0, mid - 50000),
      financial_year: fy,
    }).total_tax;

    if (testTax <= newRegimeTax) {
      bestDeduction = mid;
      high = mid;
    } else {
      low = mid;
    }
  }

  return Math.round(bestDeduction);
}

/**
 * Generate Advance Tax Schedule (Section 208 / 211)
 */
export function calculateAdvanceTaxSchedule(
  annualTaxLiability: number,
  tdsDeducted: number = 0,
): {
  isApplicable: boolean;
  netAdvanceTax: number;
  installments: AdvanceTaxInstallment[];
} {
  const netTax = Math.max(0, annualTaxLiability - tdsDeducted);
  const isApplicable = netTax >= 10000;

  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentDay = now.getDate();

  const getStatus = (
    month: number,
    day: number,
  ): "upcoming" | "current" | "past" => {
    if (currentMonth > month || (currentMonth === month && currentDay > day)) {
      return "past";
    }
    if (currentMonth === month || currentMonth === month - 1) {
      return "current";
    }
    return "upcoming";
  };

  const q1Due = Math.round(netTax * 0.15);
  const q2Due = Math.round(netTax * 0.3); // 45% cumulative - 15%
  const q3Due = Math.round(netTax * 0.3); // 75% cumulative - 45%
  const q4Due = Math.round(netTax * 0.25); // 100% cumulative - 75%

  const installments: AdvanceTaxInstallment[] = [
    {
      quarter: "1st Installment (15%)",
      due_date: "15th June",
      cumulative_percentage: 15,
      quarter_amount_due: q1Due,
      cumulative_amount_due: Math.round(netTax * 0.15),
      status: getStatus(6, 15),
    },
    {
      quarter: "2nd Installment (45%)",
      due_date: "15th September",
      cumulative_percentage: 45,
      quarter_amount_due: q2Due,
      cumulative_amount_due: Math.round(netTax * 0.45),
      status: getStatus(9, 15),
    },
    {
      quarter: "3rd Installment (75%)",
      due_date: "15th December",
      cumulative_percentage: 75,
      quarter_amount_due: q3Due,
      cumulative_amount_due: Math.round(netTax * 0.75),
      status: getStatus(12, 15),
    },
    {
      quarter: "4th Installment (100%)",
      due_date: "15th March",
      cumulative_percentage: 100,
      quarter_amount_due: q4Due,
      cumulative_amount_due: netTax,
      status: getStatus(3, 15),
    },
  ];

  return {
    isApplicable,
    netAdvanceTax: netTax,
    installments,
  };
}

/**
 * Full Master Comparison & Optimization Engine
 */
export function calculateIndianTaxMaster(
  inputs: IndianTaxInputs,
): TaxComparisonResult {
  const newRegime = calculateNewRegimeDetails(inputs);
  const oldRegime = calculateOldRegimeDetails(inputs);

  const recommendedRegime =
    newRegime.total_tax <= oldRegime.total_tax ? "new" : "old";
  const taxDifference = Math.abs(oldRegime.total_tax - newRegime.total_tax);
  const monthlySavings = Math.round(taxDifference / 12);
  const breakevenDeductions = calculateBreakevenDeductions(
    newRegime.gross_income,
    inputs.financial_year,
  );

  // Capital gains summary
  const cgSummary = calculateCapitalGainsTax(inputs);

  // Advance Tax & TDS Reconciliation
  const recommendedTax =
    recommendedRegime === "new" ? newRegime.total_tax : oldRegime.total_tax;
  const tdsDeducted = Math.max(0, inputs.tds_deducted || 0);
  const advanceTaxPaid = Math.max(0, inputs.advance_tax_paid || 0);
  const totalTaxPaidAlready = tdsDeducted + advanceTaxPaid;
  const balance = recommendedTax - totalTaxPaidAlready;

  const advanceTaxInfo = calculateAdvanceTaxSchedule(
    recommendedTax,
    tdsDeducted,
  );

  // Actionable Tax Planning Insights
  const recommendations: string[] = [];

  if (recommendedRegime === "new") {
    recommendations.push(
      `New Tax Regime is optimal, saving ₹${taxDifference.toLocaleString("en-IN")} annually over Old Regime.`,
    );
    if (!inputs.eighty_ccd_2 || inputs.eighty_ccd_2 === 0) {
      recommendations.push(
        "Tip: Section 80CCD(2) (Employer NPS contribution up to 14% of Basic) is eligible under the New Regime and can lower your taxable income further.",
      );
    }
    if (oldRegime.total_deductions < breakevenDeductions) {
      const needed = breakevenDeductions - oldRegime.total_deductions;
      recommendations.push(
        `To make the Old Regime beneficial, you would need an additional ₹${needed.toLocaleString("en-IN")} in eligible deductions (Total ₹${breakevenDeductions.toLocaleString("en-IN")}).`,
      );
    }
  } else {
    recommendations.push(
      `Old Tax Regime is optimal, saving ₹${taxDifference.toLocaleString("en-IN")} annually due to strong deductions (₹${oldRegime.total_deductions.toLocaleString("en-IN")}).`,
    );
    if ((inputs.eighty_c || 0) < 150000) {
      const remaining80C = 150000 - (inputs.eighty_c || 0);
      recommendations.push(
        `Invest ₹${remaining80C.toLocaleString("en-IN")} in 80C (PPF, ELSS, EPF) to maximize your ₹1.5 Lakh limit.`,
      );
    }
    if (!inputs.eighty_ccd_1b || inputs.eighty_ccd_1b < 50000) {
      const remainingNPS = 50000 - (inputs.eighty_ccd_1b || 0);
      recommendations.push(
        `Contribute ₹${remainingNPS.toLocaleString("en-IN")} to NPS Tier-1 under Section 80CCD(1B) for exclusive extra tax reduction.`,
      );
    }
    if (!inputs.eighty_d_self || inputs.eighty_d_self < 25000) {
      recommendations.push(
        "Consider securing comprehensive health insurance for self and family to utilize up to ₹25,000 (or ₹50,000 for seniors) under Section 80D.",
      );
    }
  }

  // Capital Gains Advice
  if ((inputs.ltcg_equity || 0) > 0 && (inputs.ltcg_equity || 0) <= 125000) {
    recommendations.push(
      "Your LTCG on equity is within the ₹1.25 Lakh tax-free exemption limit (Budget 2024 revised), resulting in ₹0 capital gains tax.",
    );
  } else if ((inputs.ltcg_equity || 0) > 125000) {
    recommendations.push(
      `LTCG on equity above ₹1.25 Lakh is taxed at the new 12.5% rate. Consider tax-loss harvesting to reduce gains.`,
    );
  }

  if (balance < 0) {
    recommendations.push(
      `Income Tax Refund of ₹${Math.abs(balance).toLocaleString("en-IN")} is due from the Income Tax Department when you file your ITR.`,
    );
  } else if (balance > 10000) {
    recommendations.push(
      `Balance Self-Assessment Tax of ₹${balance.toLocaleString("en-IN")} is payable before filing ITR.`,
    );
  }

  return {
    new_regime: newRegime,
    old_regime: oldRegime,
    recommended_regime: recommendedRegime,
    tax_difference: taxDifference,
    annual_savings: taxDifference,
    monthly_savings: monthlySavings,
    breakeven_deductions: breakevenDeductions,
    current_old_deductions: oldRegime.total_deductions,
    advance_tax_schedule: advanceTaxInfo.installments,
    net_payable_or_refund: {
      recommended_tax: recommendedTax,
      tds_deducted: tdsDeducted,
      advance_tax_paid: advanceTaxPaid,
      balance: balance,
      is_refund: balance < 0,
    },
    capital_gains_summary: {
      total_gains: cgSummary.total_gains,
      total_cg_tax: cgSummary.cg_tax,
      ltcg_exemption_used: cgSummary.ltcg_exemption_used,
    },
    recommendations,
  };
}

// Backward compatibility helper
export function calculateNewRegime(grossIncome: number): TaxBreakdown {
  return calculateNewRegimeDetails({ gross_salary: grossIncome });
}

// Backward compatibility helper
export function calculateOldRegime(
  grossIncome: number,
  hraExemption: number,
  eightyC: number,
  eightyD: number,
  homeLoanInterest: number,
  otherDeductions: number,
): TaxBreakdown {
  return calculateOldRegimeDetails({
    gross_salary: grossIncome,
    hra_exemption_override: hraExemption,
    eighty_c: eightyC,
    eighty_d_self: eightyD,
    home_loan_interest: homeLoanInterest,
    other_deductions: otherDeductions,
  });
}

