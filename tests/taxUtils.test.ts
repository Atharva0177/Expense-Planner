import { describe, it, expect } from "vitest";
import {
  calculateHRAExemption,
  calculateCapitalGainsTax,
  calculateBreakevenDeductions,
  calculateNewRegimeDetails,
  calculateOldRegimeDetails,
} from "../src/lib/taxUtils";

describe("calculateHRAExemption", () => {
  it("exempts the minimum of (HRA received, % of basic, rent - 10% basic)", () => {
    // basic 600000, HRA 240000, rent 300000, metro (50%)
    // candidates: 240000 | 300000 | 240000 -> 240000
    const r = calculateHRAExemption(600000, 240000, 300000, true);
    expect(r.exemptAmount).toBe(240000);
    expect(r.taxableHRA).toBe(0);
  });

  it("limits the exemption to rent minus 10% of basic when that is smallest", () => {
    // basic 600000, HRA 240000, rent 120000
    // candidates: 240000 | 300000 | 60000 -> 60000
    const r = calculateHRAExemption(600000, 240000, 120000, true);
    expect(r.exemptAmount).toBe(60000);
    expect(r.taxableHRA).toBe(180000);
  });

  it("uses 40% of basic for non-metro cities", () => {
    // basic 600000 non-metro -> 40% = 240000; rent 500000 -> 440000; HRA 300000
    // candidates: 300000 | 240000 | 440000 -> 240000
    const r = calculateHRAExemption(600000, 300000, 500000, false);
    expect(r.exemptAmount).toBe(240000);
    expect(r.metroPercentage).toBe(40);
  });

  it("flags landlord PAN requirement above ₹1L annual rent", () => {
    expect(calculateHRAExemption(600000, 240000, 150000, true).requiresLandlordPan).toBe(true);
    expect(calculateHRAExemption(600000, 240000, 99000, true).requiresLandlordPan).toBe(false);
  });

  it("never returns a negative exemption", () => {
    const r = calculateHRAExemption(600000, 240000, 0, true);
    expect(r.exemptAmount).toBeGreaterThanOrEqual(0);
  });
});

describe("New regime — FY 2025-26 (Budget 2025 slabs, ₹12L rebate)", () => {
  // Reference: ClearTax worked examples (verified against Union Budget 2025)
  it("matches the official worked example: ₹15L salary → ₹97,500 total tax", () => {
    // Taxable 14,25,000: 4-8L @5% = 20,000; 8-12L @10% = 40,000;
    // 12-14.25L @15% = 33,750 → 93,750 + 4% cess = 97,500
    const r = calculateNewRegimeDetails({
      gross_salary: 1500000,
      financial_year: "2025-26",
    });
    expect(r.taxable_income).toBe(1425000);
    expect(r.slab_tax).toBe(93750);
    expect(r.total_tax).toBe(97500);
  });

  it("zero tax up to ₹12.75L gross salary (₹12L taxable + ₹75k std deduction)", () => {
    const r = calculateNewRegimeDetails({
      gross_salary: 1275000,
      financial_year: "2025-26",
    });
    expect(r.taxable_income).toBe(1200000);
    expect(r.rebate_87a).toBe(60000);
    expect(r.total_tax).toBe(0);
  });

  it("marginal relief at ₹12.1L taxable: tax capped at income above ₹12L", () => {
    // Official illustration: taxable 12,10,000 → slab tax 61,500, capped to
    // 10,000 (+400 cess = 10,400)
    const r = calculateNewRegimeDetails({
      gross_salary: 1275000,
      other_income: 10000,
      financial_year: "2025-26",
    });
    expect(r.taxable_income).toBe(1210000);
    expect(r.marginal_relief_87a).toBe(51500);
    expect(r.slab_tax).toBe(10000);
    expect(r.total_tax).toBe(10400);
  });

  it("matches the official ₹25L salary example: new regime ₹3,19,800", () => {
    // Salary 25L, HRA exempt 4L (old only), 80C 1.5L, 80D 25k
    // New: taxable 24,25,000 → 20k+40k+60k+80k+1,00,000+7,500 = 3,07,500
    // + 4% cess = 3,19,800
    const r = calculateNewRegimeDetails({
      gross_salary: 2500000,
      financial_year: "2025-26",
    });
    expect(r.slab_tax).toBe(307500);
    expect(r.total_tax).toBe(319800);
  });

  it("old regime beats new at ₹25L with strong deductions (official example)", () => {
    // Old: taxable 18,75,000 → 12,500+1,00,000+2,62,500 = 3,75,000 + cess = 3,90,000
    const oldR = calculateOldRegimeDetails({
      gross_salary: 2500000,
      hra_exemption_override: 400000,
      eighty_c: 150000,
      eighty_d_self: 25000,
      financial_year: "2025-26",
    });
    expect(oldR.taxable_income).toBe(1875000);
    expect(oldR.total_tax).toBe(390000);
  });
});

describe("New regime — FY 2024-25 (Budget 2024 slabs, ₹7L rebate)", () => {
  it("computes the Budget 2024 slab structure correctly at ₹12L gross", () => {
    // Taxable 11,25,000: 3-7L @5% = 20,000; 7-10L @10% = 30,000;
    // 10-11.25L @15% = 18,750 → 68,750 + cess = 71,500
    const r = calculateNewRegimeDetails({
      gross_salary: 1200000,
      financial_year: "2024-25",
    });
    expect(r.taxable_income).toBe(1125000);
    expect(r.slab_tax).toBe(68750);
    expect(r.total_tax).toBe(71500);
  });

  it("zero tax up to ₹7.75L gross (₹7L taxable + ₹75k std deduction)", () => {
    const r = calculateNewRegimeDetails({
      gross_salary: 775000,
      financial_year: "2024-25",
    });
    expect(r.total_tax).toBe(0);
  });

  it("marginal relief just above ₹7L (₹7.1L taxable): tax capped at ₹10,000", () => {
    // taxable 7,10,000: slab tax = 20,000 + 1,000 = 21,000 → capped at 10,000
    const r = calculateNewRegimeDetails({
      gross_salary: 785000,
      financial_year: "2024-25",
    });
    expect(r.marginal_relief_87a).toBe(11000);
    expect(r.slab_tax).toBe(10000);
    expect(r.total_tax).toBe(10400);
  });
});

describe("New regime — FY 2026-27 (Budget 2026: slabs unchanged from FY 2025-26)", () => {
  it("applies the FY 2025-26 slab structure", () => {
    const r = calculateNewRegimeDetails({
      gross_salary: 1500000,
      financial_year: "2026-27",
    });
    expect(r.slab_tax).toBe(93750);
    expect(r.total_tax).toBe(97500);
  });

  it("keeps the ₹12L rebate boundary", () => {
    const r = calculateNewRegimeDetails({
      gross_salary: 1275000,
      financial_year: "2026-27",
    });
    expect(r.total_tax).toBe(0);
  });
});

describe("Capital gains (Sec 111A/112A) — FY-aware special rates", () => {
  it("taxes LTCG equity at 12.5% with the ₹1.25L exemption (FY 2024-25 & 2025-26)", () => {
    for (const fy of ["2024-25", "2025-26"]) {
      const r = calculateCapitalGainsTax({ ltcg_equity: 225000, financial_year: fy });
      expect(r.ltcg_exemption_used).toBe(125000);
      expect(r.ltcg_equity_tax).toBe(Math.round(100000 * 0.125));
    }
  });

  it("taxes LTCG equity at 13% from FY 2026-27 (Income Tax Act 2025)", () => {
    const r = calculateCapitalGainsTax({ ltcg_equity: 225000, financial_year: "2026-27" });
    expect(r.ltcg_exemption_used).toBe(125000);
    expect(r.ltcg_equity_tax).toBe(Math.round(100000 * 0.13));
  });

  it("taxes STCG equity at 20%", () => {
    const r = calculateCapitalGainsTax({ stcg_equity: 50000, financial_year: "2025-26" });
    expect(r.stcg_equity_tax).toBe(10000);
  });

  it("handles the empty case", () => {
    const r = calculateCapitalGainsTax({});
    expect(r.cg_tax).toBe(0);
  });

  it("sums components into the total", () => {
    const r = calculateCapitalGainsTax({
      stcg_equity: 50000,
      ltcg_equity: 225000,
      financial_year: "2025-26",
    });
    expect(r.cg_tax).toBe(r.stcg_equity_tax + r.ltcg_equity_tax + r.ltcg_other_tax);
  });
});

describe("calculateBreakevenDeductions (FY-aware)", () => {
  it("FY 2024-25: zero old-regime deduction need below ₹7.75L gross", () => {
    // Old regime with 50k std + 5L boundary: below 5.5L gross the old regime
    // is already zero-tax, so no extra deductions are needed
    expect(calculateBreakevenDeductions(500000, "2024-25")).toBe(0);
  });

  it("FY 2025-26: needs old-regime deductions to reach zero at ₹12.75L gross", () => {
    // New regime is zero-tax at 12.75L; old regime needs taxable <= 5L,
    // i.e. gross - 50k std - 7.75L of other deductions
    const v = calculateBreakevenDeductions(1275000, "2025-26");
    expect(v).toBeGreaterThan(0);
    expect(v).toBeLessThanOrEqual(1275000);
  });

  it("returns a positive, finite number at high income", () => {
    const v = calculateBreakevenDeductions(1200000, "2025-26");
    expect(v).toBeGreaterThan(0);
    expect(Number.isFinite(v)).toBe(true);
  });
});
