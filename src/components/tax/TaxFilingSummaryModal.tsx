import React from "react";
import { TaxBreakdown, TaxComparisonResult } from "../../lib/taxUtils";
import { FileText, Download, Printer, X, Check, ArrowRight } from "lucide-react";

interface TaxFilingSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: TaxComparisonResult;
  userEmail?: string;
}

export function TaxFilingSummaryModal({
  isOpen,
  onClose,
  result,
  userEmail
}: TaxFilingSummaryModalProps) {
  if (!isOpen) return null;

  const chosenRegime = result.recommended_regime === "new" ? result.new_regime : result.old_regime;
  const isNewRegime = result.recommended_regime === "new";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-[#FCFAF7] dark:bg-[#1C1C1C] border-2 border-[#1A1A1A] dark:border-[#383838] max-w-2xl w-full p-4 sm:p-6 shadow-[8px_8px_0px_#1A1A1A] dark:shadow-[8px_8px_0px_#000] space-y-4 max-h-[90vh] overflow-y-auto font-mono">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b-2 border-[#1A1A1A] dark:border-[#383838] pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#2A4B3A] dark:text-emerald-400" />
            <div>
              <h3 className="font-serif italic text-lg sm:text-xl font-bold text-[#1A1A1A] dark:text-[#F0ECE1]">
                Indian Tax Computation Sheet
              </h3>
              <p className="text-[10px] uppercase font-mono tracking-widest text-[#777] dark:text-[#999]">
                FY {chosenRegime.financial_year} • {isNewRegime ? "Section 115BAC (New Regime)" : "Old Tax Regime"}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-xs font-mono p-1 border border-transparent hover:border-[#1A1A1A] dark:hover:border-white text-[#888] hover:text-black dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Statement Body */}
        <div className="space-y-4 text-xs">
          {/* Assessee Details */}
          <div className="p-3 bg-white dark:bg-[#161616] border border-[#1A1A1A] dark:border-[#383838] grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-[#888] uppercase text-[9px] block">Assessee Identifier:</span>
              <span className="font-bold text-[#1A1A1A] dark:text-[#F0ECE1] truncate block">{userEmail || "Individual Taxpayer"}</span>
            </div>
            <div>
              <span className="text-[#888] uppercase text-[9px] block">Financial Year:</span>
              <span className="font-bold text-[#1A1A1A] dark:text-[#F0ECE1]">FY {chosenRegime.financial_year} (AY 2025-26)</span>
            </div>
          </div>

          {/* Income Computation Table */}
          <div className="border border-[#1A1A1A] dark:border-[#383838] bg-white dark:bg-[#161616] p-3 space-y-2">
            <h4 className="font-bold uppercase text-[10px] tracking-wider text-[#1A1A1A] dark:text-white border-b border-[#EBE7DF] dark:border-[#2E2E2E] pb-1">
              Part A: Gross Total Income (GTI)
            </h4>
            
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span>1. Income from Salaries / CTC:</span>
                <span className="font-bold">₹{chosenRegime.salary_income.toLocaleString("en-IN")}</span>
              </div>
              {chosenRegime.other_income > 0 && (
                <div className="flex justify-between">
                  <span>2. Income from Other Sources (Interest/Rent):</span>
                  <span className="font-bold">₹{chosenRegime.other_income.toLocaleString("en-IN")}</span>
                </div>
              )}
              {result.capital_gains_summary.total_gains > 0 && (
                <div className="flex justify-between">
                  <span>3. Capital Gains (Equity / Real Estate / Gold):</span>
                  <span className="font-bold">₹{result.capital_gains_summary.total_gains.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t border-dotted border-[#1A1A1A] dark:border-[#444] pt-1 text-xs">
                <span>Gross Total Income (GTI):</span>
                <span>₹{(chosenRegime.gross_income + result.capital_gains_summary.total_gains).toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* Deductions Breakdown */}
          <div className="border border-[#1A1A1A] dark:border-[#383838] bg-white dark:bg-[#161616] p-3 space-y-2">
            <h4 className="font-bold uppercase text-[10px] tracking-wider text-[#1A1A1A] dark:text-white border-b border-[#EBE7DF] dark:border-[#2E2E2E] pb-1">
              Part B: Allowable Deductions & Exemptions
            </h4>

            <div className="space-y-1.5 text-[11px]">
              {Object.entries(chosenRegime.deduction_breakdown).map(([label, val]) => (
                <div key={label} className="flex justify-between text-[#555] dark:text-[#CCC]">
                  <span>{label}:</span>
                  <span className="font-bold">- ₹{val.toLocaleString("en-IN")}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold border-t border-dotted border-[#1A1A1A] dark:border-[#444] pt-1 text-xs text-[#2A4B3A] dark:text-emerald-400">
                <span>Total Allowable Deductions:</span>
                <span>- ₹{chosenRegime.total_deductions.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* Tax Computation */}
          <div className="border border-[#1A1A1A] dark:border-[#383838] bg-white dark:bg-[#161616] p-3 space-y-2">
            <h4 className="font-bold uppercase text-[10px] tracking-wider text-[#1A1A1A] dark:text-white border-b border-[#EBE7DF] dark:border-[#2E2E2E] pb-1">
              Part C: Tax Calculation & Statutory Slabs
            </h4>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span>Net Taxable Income (Normal Income):</span>
                <span className="font-bold">₹{chosenRegime.taxable_income.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax computed on Slabs:</span>
                <span>₹{(chosenRegime.slab_tax + chosenRegime.rebate_87a).toLocaleString("en-IN")}</span>
              </div>
              {chosenRegime.rebate_87a > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Less: Section 87A Tax Rebate:</span>
                  <span>- ₹{chosenRegime.rebate_87a.toLocaleString("en-IN")}</span>
                </div>
              )}
              {chosenRegime.capital_gains_tax > 0 && (
                <div className="flex justify-between">
                  <span>Add: Special Rate Capital Gains Tax:</span>
                  <span>+ ₹{chosenRegime.capital_gains_tax.toLocaleString("en-IN")}</span>
                </div>
              )}
              {chosenRegime.surcharge > 0 && (
                <div className="flex justify-between text-amber-700 dark:text-amber-400">
                  <span>Add: Surcharge (Marginal Relief Adjusted):</span>
                  <span>+ ₹{(chosenRegime.surcharge - chosenRegime.marginal_relief_surcharge).toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Add: Health & Education Cess (4%):</span>
                <span>+ ₹{chosenRegime.cess.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-[#1A1A1A] dark:border-[#383838] pt-2 text-sm text-[#1A1A1A] dark:text-white">
                <span>Total Annual Tax Liability:</span>
                <span className="text-red-700 dark:text-rose-400">₹{chosenRegime.total_tax.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* Part D: TDS & Balance Payable / Refund */}
          <div className="border border-[#1A1A1A] dark:border-[#383838] bg-white dark:bg-[#161616] p-3 space-y-2">
            <h4 className="font-bold uppercase text-[10px] tracking-wider text-[#1A1A1A] dark:text-white border-b border-[#EBE7DF] dark:border-[#2E2E2E] pb-1">
              Part D: Taxes Paid & Final Reconciliation
            </h4>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between text-[#555] dark:text-[#CCC]">
                <span>TDS Deducted (Form 16 / 26AS):</span>
                <span>₹{result.net_payable_or_refund.tds_deducted.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-[#555] dark:text-[#CCC]">
                <span>Advance Tax Paid:</span>
                <span>₹{result.net_payable_or_refund.advance_tax_paid.toLocaleString("en-IN")}</span>
              </div>
              <div className={`flex justify-between font-bold border-t border-dotted border-[#1A1A1A] dark:border-[#444] pt-2 text-sm ${
                result.net_payable_or_refund.is_refund ? "text-[#2A4B3A] dark:text-emerald-400" : "text-red-700 dark:text-rose-400"
              }`}>
                <span>{result.net_payable_or_refund.is_refund ? "Net Refund Claimable on ITR:" : "Balance Tax Payable (Self Assessment):"}</span>
                <span>₹{Math.abs(result.net_payable_or_refund.balance).toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-[#EBE7DF] dark:border-[#2E2E2E]">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 border border-[#1A1A1A] dark:border-[#444] text-[10px] font-mono uppercase font-bold text-[#666] dark:text-[#AAA]"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-1.5 bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] text-[10px] font-mono uppercase font-bold tracking-wider hover:opacity-90 flex items-center gap-1.5 shadow-[2px_2px_0px_#777] dark:shadow-[2px_2px_0px_#000]"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Computation</span>
          </button>
        </div>
      </div>
    </div>
  );
}
