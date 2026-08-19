import React from "react";
import { AdvanceTaxInstallment } from "../../lib/taxUtils";
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

interface AdvanceTaxPlannerProps {
  schedule: AdvanceTaxInstallment[];
  netAdvanceTax: number;
  tdsDeducted: number;
  setTdsDeducted: (v: number) => void;
  advanceTaxPaid: number;
  setAdvanceTaxPaid: (v: number) => void;
  totalTaxLiability: number;
}

export function AdvanceTaxPlanner({
  schedule,
  netAdvanceTax,
  tdsDeducted,
  setTdsDeducted,
  advanceTaxPaid,
  setAdvanceTaxPaid,
  totalTaxLiability,
}: AdvanceTaxPlannerProps) {
  const isLiableForAdvanceTax = netAdvanceTax >= 10000;
  const balance = totalTaxLiability - (tdsDeducted + advanceTaxPaid);
  const isRefund = balance < 0;

  return (
    <div className="bg-[#FCFAF7] dark:bg-[#202020] border border-[#1A1A1A] dark:border-[#444] p-4 sm:p-5 space-y-4 font-mono">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#1A1A1A] dark:border-[#444] pb-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#1A1A1A] dark:text-[#F0ECE1]">
            Advance Tax & TDS Reconciliation (Sec 208 / 211)
          </h4>
        </div>
        <span
          className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
            isLiableForAdvanceTax
              ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-400"
              : "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-400"
          }`}
        >
          {isLiableForAdvanceTax
            ? "Advance Tax Mandatory (>₹10k net tax)"
            : "Exempt from Advance Tax"}
        </span>
      </div>

      {/* TDS & Taxes Paid Input */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
            TDS Deducted (Form 26AS / AIS)
          </label>
          <input
            type="number"
            min={0}
            value={tdsDeducted || ""}
            onChange={(e) => setTdsDeducted(Number(e.target.value))}
            placeholder="0"
            className="w-full px-2.5 py-1.5 border border-[#1A1A1A] dark:border-[#555] bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1] font-mono text-xs font-bold"
          />
          <p className="text-[9px] text-[#777] dark:text-[#999] mt-0.5">
            TDS deducted by employer or bank
          </p>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
            Advance Tax Already Paid
          </label>
          <input
            type="number"
            min={0}
            value={advanceTaxPaid || ""}
            onChange={(e) => setAdvanceTaxPaid(Number(e.target.value))}
            placeholder="0"
            className="w-full px-2.5 py-1.5 border border-[#1A1A1A] dark:border-[#555] bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1] font-mono text-xs font-bold"
          />
          <p className="text-[9px] text-[#777] dark:text-[#999] mt-0.5">
            Via Challan ITNS 280
          </p>
        </div>

        <div className="bg-white dark:bg-[#161616] p-2.5 border border-[#1A1A1A] dark:border-[#383838] flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-[#666] dark:text-[#AAA]">
            {isRefund ? "Estimated Refund Due" : "Balance Tax Payable"}
          </span>
          <span
            className={`text-base font-bold font-mono ${
              isRefund
                ? "text-[#2A4B3A] dark:text-emerald-400"
                : balance > 0
                  ? "text-red-700 dark:text-rose-400"
                  : "text-[#1A1A1A] dark:text-white"
            }`}
          >
            {isRefund
              ? `+ ₹${Math.abs(balance).toLocaleString("en-IN")}`
              : `₹${balance.toLocaleString("en-IN")}`}
          </span>
        </div>
      </div>

      {/* Quarterly Installments Table */}
      {isLiableForAdvanceTax && (
        <div className="border border-[#1A1A1A] dark:border-[#383838] bg-white dark:bg-[#161616] p-3 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#666] dark:text-[#AAA]">
            Quarterly Payment Schedule & Deadlines:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-[11px] text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1A1A1A] dark:border-[#444] text-[#888] uppercase text-[9px] tracking-wider">
                  <th className="pb-1.5 font-bold">Installment</th>
                  <th className="pb-1.5 font-bold">Statutory Due Date</th>
                  <th className="pb-1.5 font-bold">Cumulative %</th>
                  <th className="pb-1.5 font-bold text-right">
                    Quarter Amount
                  </th>
                  <th className="pb-1.5 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE7DF] dark:divide-[#2E2E2E]">
                {schedule.map((inst, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-[#FCFAF7] dark:hover:bg-[#202020]"
                  >
                    <td className="py-2 font-bold text-[#1A1A1A] dark:text-[#F0ECE1]">
                      {inst.quarter}
                    </td>
                    <td className="py-2 text-[#555] dark:text-[#AAA] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#777]" />
                      <span>{inst.due_date}</span>
                    </td>
                    <td className="py-2 text-[#555] dark:text-[#AAA]">
                      {inst.cumulative_percentage}%
                    </td>
                    <td className="py-2 text-right font-bold text-[#1A1A1A] dark:text-[#F0ECE1]">
                      ₹{inst.quarter_amount_due.toLocaleString("en-IN")}
                    </td>
                    <td className="py-2 text-right">
                      {inst.status === "past" ? (
                        <span className="text-[9px] uppercase px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold">
                          Passed
                        </span>
                      ) : inst.status === "current" ? (
                        <span className="text-[9px] uppercase px-1.5 py-0.5 bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-bold animate-pulse">
                          Due Soon
                        </span>
                      ) : (
                        <span className="text-[9px] uppercase px-1.5 py-0.5 bg-blue-100 dark:bg-sky-950 text-blue-900 dark:text-sky-300 font-bold">
                          Upcoming
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2 text-[10px] text-[#777] dark:text-[#AAA] border-t border-dotted border-[#1A1A1A] dark:border-[#444] flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <span>
              <strong>Interest under Sec 234C:</strong> Delay in paying any
              installment attracts simple interest @ 1% per month on the
              shortfall amount.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
