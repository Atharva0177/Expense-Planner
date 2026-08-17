export interface TaxBreakdown {
  gross_income: number;
  total_deductions: number;
  taxable_income: number;
  tax_amount: number;
  cess: number;
  total_tax: number;
  monthly_take_home: number;
}

export function calculateNewRegime(grossIncome: number): TaxBreakdown {
  const standardDeduction = 75000;
  let taxableIncome = Math.max(0, grossIncome - standardDeduction);
  
  let tax = 0;
  // Rebate under 87A up to 7L
  if (taxableIncome <= 700000) {
    tax = 0;
  } else {
    // New Slabs FY 25-26
    if (taxableIncome > 300000) {
      tax += Math.min(400000, taxableIncome - 300000) * 0.05;
    }
    if (taxableIncome > 700000) {
      tax += Math.min(300000, taxableIncome - 700000) * 0.10;
    }
    if (taxableIncome > 1000000) {
      tax += Math.min(200000, taxableIncome - 1000000) * 0.15;
    }
    if (taxableIncome > 1200000) {
      tax += Math.min(300000, taxableIncome - 1200000) * 0.20;
    }
    if (taxableIncome > 1500000) {
      tax += (taxableIncome - 1500000) * 0.30;
    }
    
    // Marginal relief logic simplified: if tax payable > (income - 700000), limit tax to (income - 700000)
    // Actually marginal relief applies near 7L
    if (taxableIncome > 700000 && taxableIncome <= 727777) {
      const taxWithoutRelief = tax;
      const incomeAbove7L = taxableIncome - 700000;
      if (taxWithoutRelief > incomeAbove7L) {
        tax = incomeAbove7L;
      }
    }
  }

  const cess = tax * 0.04;
  const totalTax = tax + cess;
  const monthlyTakeHome = Math.round((grossIncome - totalTax) / 12);

  return {
    gross_income: grossIncome,
    total_deductions: standardDeduction,
    taxable_income: taxableIncome,
    tax_amount: tax,
    cess,
    total_tax: totalTax,
    monthly_take_home: monthlyTakeHome
  };
}

export function calculateOldRegime(
  grossIncome: number,
  hraExemption: number,
  eightyC: number, // max 150000
  eightyD: number, // max 75000 typically
  homeLoanInterest: number, // max 200000
  otherDeductions: number // PT, LTA, etc.
): TaxBreakdown {
  const standardDeduction = 50000;
  
  // Cap standard deductions
  const capped80C = Math.min(150000, eightyC);
  const capped80D = Math.min(75000, eightyD);
  const cappedHomeLoan = Math.min(200000, homeLoanInterest);
  
  const totalDeductions = standardDeduction + hraExemption + capped80C + capped80D + cappedHomeLoan + otherDeductions;
  let taxableIncome = Math.max(0, grossIncome - totalDeductions);
  
  let tax = 0;
  // Rebate under 87A up to 5L
  if (taxableIncome <= 500000) {
    tax = 0;
  } else {
    // Old Slabs
    if (taxableIncome > 250000) {
      tax += Math.min(250000, taxableIncome - 250000) * 0.05;
    }
    if (taxableIncome > 500000) {
      tax += Math.min(500000, taxableIncome - 500000) * 0.20;
    }
    if (taxableIncome > 1000000) {
      tax += (taxableIncome - 1000000) * 0.30;
    }
  }

  const cess = tax * 0.04;
  const totalTax = tax + cess;
  const monthlyTakeHome = Math.round((grossIncome - totalTax) / 12);

  return {
    gross_income: grossIncome,
    total_deductions: totalDeductions,
    taxable_income: taxableIncome,
    tax_amount: tax,
    cess,
    total_tax: totalTax,
    monthly_take_home: monthlyTakeHome
  };
}
