import React, { useState } from "react";
import { calculateHRAExemption } from "../../lib/taxUtils";
import { Home, Check, X, AlertCircle, Building2 } from "lucide-react";

interface HraCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (exemptAmount: number, rentPaid: number, isMetro: boolean) => void;
  initialBasicSalary?: number;
  initialHraReceived?: number;
}

export function HraCalculatorModal({
  isOpen,
  onClose,
  onApply,
  initialBasicSalary = 0,
  initialHraReceived = 0
}: HraCalculatorModalProps) {
  const [basicSalary, setBasicSalary] = useState<number>(initialBasicSalary || 600000);
  const [hraReceived, setHraReceived] = useState<number>(initialHraReceived || 240000);
  const [monthlyRent, setMonthlyRent] = useState<number>(25000);
  const [isMetro, setIsMetro] = useState<boolean>(true);

  if (!isOpen) return null;

  const annualRent = monthlyRent * 12;
  const result = calculateHRAExemption(basicSalary, hraReceived, annualRent, isMetro);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-[#FCFAF7] dark:bg-[#1C1C1C] border-2 border-[#1A1A1A] dark:border-[#383838] max-w-lg w-full p-4 sm:p-6 shadow-[8px_8px_0px_#1A1A1A] dark:shadow-[8px_8px_0px_#000] space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b-2 border-[#1A1A1A] dark:border-[#383838] pb-3">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-[#2A4B3A] dark:text-emerald-400" />
            <h3 className="font-serif italic text-lg sm:text-xl font-bold text-[#1A1A1A] dark:text-[#F0ECE1]">
              HRA Exemption Calculator
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-xs font-mono p-1 border border-transparent hover:border-[#1A1A1A] dark:hover:border-white text-[#888] hover:text-black dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs font-mono text-[#555] dark:text-[#AAA]">
          Calculates your tax-free House Rent Allowance under <span className="font-bold text-[#1A1A1A] dark:text-white">Section 10(13A) & Rule 2A</span> of the Income Tax Act.
        </p>

        {/* Input Fields */}
        <div className="space-y-3 font-mono text-xs">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
              Annual Basic Salary + DA (₹)
            </label>
            <input
              type="number"
              min={0}
              value={basicSalary || ""}
              onChange={(e) => setBasicSalary(Number(e.target.value))}
              placeholder="e.g. 600000"
              className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-white dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] font-bold"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
              Annual HRA Received from Employer (₹)
            </label>
            <input
              type="number"
              min={0}
              value={hraReceived || ""}
              onChange={(e) => setHraReceived(Number(e.target.value))}
              placeholder="e.g. 240000"
              className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-white dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] font-bold"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
              Monthly Rent Paid by You (₹)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={monthlyRent || ""}
                onChange={(e) => setMonthlyRent(Number(e.target.value))}
                placeholder="e.g. 25000"
                className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-white dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] font-bold"
              />
              <span className="text-[10px] text-[#666] dark:text-[#AAA] whitespace-nowrap">
                = ₹{(annualRent).toLocaleString("en-IN")}/yr
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
              City Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsMetro(true)}
                className={`py-2 px-3 border text-xs font-bold flex items-center justify-center gap-1.5 ${
                  isMetro
                    ? "bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] border-[#1A1A1A] dark:border-white"
                    : "bg-white dark:bg-[#242424] text-[#1A1A1A] dark:text-[#CCC] border-[#1A1A1A] dark:border-[#444]"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Metro (50% Basic)</span>
              </button>
              <button
                type="button"
                onClick={() => setIsMetro(false)}
                className={`py-2 px-3 border text-xs font-bold flex items-center justify-center gap-1.5 ${
                  !isMetro
                    ? "bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] border-[#1A1A1A] dark:border-white"
                    : "bg-white dark:bg-[#242424] text-[#1A1A1A] dark:text-[#CCC] border-[#1A1A1A] dark:border-[#444]"
                }`}
              >
                <span>Non-Metro (40% Basic)</span>
              </button>
            </div>
            <p className="text-[9px] text-[#777] dark:text-[#999] mt-1">
              * Metro cities: Mumbai, Delhi, Kolkata, Chennai.
            </p>
          </div>
        </div>

        {/* 3-Condition Statutory Breakdown */}
        <div className="border border-[#1A1A1A] dark:border-[#383838] bg-white dark:bg-[#161616] p-3 space-y-2 font-mono text-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#666] dark:text-[#AAA]">
            Exemption is Least of the Following:
          </p>
          
          <div className="space-y-1.5 text-[11px]">
            <div className={`flex justify-between p-1.5 rounded ${result.exemptAmount === result.breakdown.actualHRA ? "bg-emerald-100 dark:bg-emerald-950/60 font-bold text-emerald-900 dark:text-emerald-300" : "text-[#555] dark:text-[#AAA]"}`}>
              <span>1. Actual HRA Received:</span>
              <span>₹{result.breakdown.actualHRA.toLocaleString("en-IN")}</span>
            </div>
            <div className={`flex justify-between p-1.5 rounded ${result.exemptAmount === result.breakdown.percentageOfBasic ? "bg-emerald-100 dark:bg-emerald-950/60 font-bold text-emerald-900 dark:text-emerald-300" : "text-[#555] dark:text-[#AAA]"}`}>
              <span>2. {result.metroPercentage}% of Basic Salary:</span>
              <span>₹{result.breakdown.percentageOfBasic.toLocaleString("en-IN")}</span>
            </div>
            <div className={`flex justify-between p-1.5 rounded ${result.exemptAmount === result.breakdown.rentMinusTenPercentBasic ? "bg-emerald-100 dark:bg-emerald-950/60 font-bold text-emerald-900 dark:text-emerald-300" : "text-[#555] dark:text-[#AAA]"}`}>
              <span>3. Rent Paid minus 10% Basic:</span>
              <span>₹{result.breakdown.rentMinusTenPercentBasic.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-[#1A1A1A] dark:border-[#444] pt-2 mt-2 flex justify-between items-center">
            <span className="font-bold text-[#1A1A1A] dark:text-white uppercase text-xs">
              Tax-Exempt HRA:
            </span>
            <span className="font-bold text-base text-[#2A4B3A] dark:text-emerald-400">
              ₹{result.exemptAmount.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="flex justify-between text-[11px] text-[#666] dark:text-[#AAA]">
            <span>Taxable HRA (added to salary):</span>
            <span className="font-mono font-bold">₹{result.taxableHRA.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Landlord PAN Alert */}
        {result.requiresLandlordPan && (
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-[11px] font-mono flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>Landlord PAN Mandatory:</strong> Because your annual rent exceeds ₹1,00,000, you must obtain and submit your landlord's PAN to your employer for Form 16 proof.
            </span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-[#EBE7DF] dark:border-[#2E2E2E]">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 border border-[#1A1A1A] dark:border-[#444] text-[10px] font-mono uppercase font-bold text-[#666] dark:text-[#AAA]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(result.exemptAmount, annualRent, isMetro);
              onClose();
            }}
            className="px-4 py-1.5 bg-[#2A4B3A] dark:bg-emerald-600 text-white text-[10px] font-mono uppercase font-bold tracking-wider hover:opacity-90 flex items-center gap-1.5 shadow-[2px_2px_0px_#1A1A1A]"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Exemption (₹{result.exemptAmount.toLocaleString("en-IN")})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
