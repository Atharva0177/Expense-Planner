import { Loan, LoanSchedule } from "../types";

export function calculateEMI(principal: number, annualRate: number, months: number): number {
  if (annualRate === 0) return Math.round(principal / months);
  const r = (annualRate / 12) / 100;
  const emi = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  return Math.round(emi);
}

export function generateAmortizationSchedule(loanId: string, userId: string, principal: number, annualRate: number, months: number, emi: number, prepayments: { month: number, amount: number }[] = []): LoanSchedule[] {
  const schedule: LoanSchedule[] = [];
  let balance = principal;
  const r = (annualRate / 12) / 100;

  for (let i = 1; i <= months; i++) {
    const interest = Math.round(balance * r);
    let prinComponent = emi - interest;

    if (i === months || balance < prinComponent) {
      prinComponent = balance;
    }

    balance = balance - prinComponent;

    schedule.push({
      loan_id: loanId,
      user_id: userId,
      month_number: i,
      interest_component: interest,
      principal_component: prinComponent,
      outstanding_balance: Math.max(0, balance),
      is_prepayment: false
    });
    
    // Check for prepayment in this month
    const prepay = prepayments.find(p => p.month === i);
    if (prepay && balance > 0) {
      const prepayAmount = Math.min(balance, prepay.amount);
      balance -= prepayAmount;
      schedule.push({
        loan_id: loanId,
        user_id: userId,
        month_number: i,
        interest_component: 0,
        principal_component: prepayAmount,
        outstanding_balance: Math.max(0, balance),
        is_prepayment: true
      });
    }

    if (balance <= 0) break;
  }

  return schedule;
}
