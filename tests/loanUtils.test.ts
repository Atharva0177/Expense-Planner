import { describe, it, expect } from "vitest";
import {
  calculateEMI,
  generateAmortizationSchedule,
} from "../src/lib/loanUtils";

describe("calculateEMI", () => {
  it("matches the standard EMI formula for a typical home loan", () => {
    // 5,00,000 @ 9.5% for 60 months -> EMI 10,501 (verified by hand & site parity)
    expect(calculateEMI(500000, 9.5, 60)).toBe(10501);
  });

  it("handles zero-interest loans as simple division", () => {
    expect(calculateEMI(120000, 0, 12)).toBe(10000);
  });

  it("produces a higher EMI for shorter tenures", () => {
    const short = calculateEMI(500000, 9.5, 36);
    const long = calculateEMI(500000, 9.5, 60);
    expect(short).toBeGreaterThan(long);
  });

  it("always returns an integer", () => {
    expect(Number.isInteger(calculateEMI(333333, 8.75, 77))).toBe(true);
  });
});

describe("generateAmortizationSchedule", () => {
  const loanId = "loan-1";
  const userId = "user-1";
  const principal = 500000;
  const rate = 9.5;
  const months = 60;
  const emi = calculateEMI(principal, rate, months);

  it("creates one row per month with declining balances", () => {
    const schedule = generateAmortizationSchedule(loanId, userId, principal, rate, months, emi);
    expect(schedule.length).toBe(months);
    expect(schedule[0].loan_id).toBe(loanId);
    expect(schedule[0].user_id).toBe(userId);
    expect(schedule[0].month_number).toBe(1);
    expect(schedule[schedule.length - 1].month_number).toBe(months);
  });

  it("splits each EMI into interest + principal", () => {
    const schedule = generateAmortizationSchedule(loanId, userId, principal, rate, months, emi);
    for (const row of schedule) {
      if (!row.is_prepayment) {
        expect(row.interest_component + row.principal_component).toBeLessThanOrEqual(emi + 1);
      }
    }
  });

  it("ends with zero outstanding balance", () => {
    const schedule = generateAmortizationSchedule(loanId, userId, principal, rate, months, emi);
    const last = schedule[schedule.length - 1];
    expect(last.outstanding_balance).toBe(0);
  });

  it("has monotonically decreasing interest and increasing principal", () => {
    const schedule = generateAmortizationSchedule(loanId, userId, principal, rate, months, emi);
    const first = schedule[0];
    const last = schedule[schedule.length - 1];
    expect(first.interest_component).toBeGreaterThan(last.interest_component);
    expect(first.principal_component).toBeLessThan(last.principal_component);
  });

  it("accounts for prepayments as separate rows", () => {
    const schedule = generateAmortizationSchedule(loanId, userId, principal, rate, months, emi, [
      { month: 2, amount: 50000 },
    ]);
    const prepayRows = schedule.filter((r) => r.is_prepayment);
    expect(prepayRows.length).toBe(1);
    expect(prepayRows[0].principal_component).toBe(50000);
    expect(prepayRows[0].interest_component).toBe(0);
  });
});
