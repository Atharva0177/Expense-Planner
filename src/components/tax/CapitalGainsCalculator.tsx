import React from "react";
import { calculateCapitalGainsTax } from "../../lib/taxUtils";
import { TrendingUp, ShieldCheck, Sparkles } from "lucide-react";

interface CapitalGainsCalculatorProps {
  stcgEquity: number;
  setStcgEquity: (v: number) => void;
  ltcgEquity: number;
  setLtcgEquity: (v: number) => void;
  ltcgOther: number;
  setLtcgOther: (v: number) => void;
  stcgSlab: number;
  setStcgSlab: (v: number) => void;
}

export function CapitalGainsCalculator({
  stcgEquity,
  setStcgEquity,
  ltcgEquity,
  setLtcgEquity,
  ltcgOther,
  setLtcgOther,
  stcgSlab,
  setStcgSlab,
}: CapitalGainsCalculatorProps) {
  const result = calculateCapitalGainsTax({
    stcg_equity: stcgEquity,
    ltcg_equity: ltcgEquity,
    ltcg_other: ltcgOther,
    stcg_slab: stcgSlab,
  });

  return (
    <div className="bg-[#FCFAF7] dark:bg-[#202020] border border-[#1A1A1A] dark:border-[#444] p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#1A1A1A] dark:border-[#444] pb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600 dark:text-sky-400" />
          <h4 className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-[#1A1A1A] dark:text-[#F0ECE1]">
            Capital Gains Taxation Engine (Budget 2024 Rules)
          </h4>
        </div>
        <span className="bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest font-mono">
          LTCG: 12.5% | STCG: 20%
        </span>
      </div>

      <p className="text-[11px] font-mono text-[#555] dark:text-[#AAA]">
        Calculates special rate capital gains tax on Listed Stocks, Mutual
        Funds, Real Estate, and Gold in accordance with direct tax amendments.
      </p>

      {/* Input Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0]">
              LTCG Equity / MF
            </label>
            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
              12.5%
            </span>
          </div>
          <input
            type="number"
            min={0}
            value={ltcgEquity || ""}
            onChange={(e) => setLtcgEquity(Number(e.target.value))}
            placeholder="0"
            className="w-full px-2.5 py-1.5 border border-[#1A1A1A] dark:border-[#555] bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1] font-mono text-xs"
          />
          <p className="text-[9px] text-[#777] dark:text-[#999] mt-0.5">
            Holding &gt; 12 mo (₹1.25L exempt)
          </p>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0]">
              STCG Equity / MF
            </label>
            <span className="text-[9px] text-red-600 dark:text-rose-400 font-bold">
              20%
            </span>
          </div>
          <input
            type="number"
            min={0}
            value={stcgEquity || ""}
            onChange={(e) => setStcgEquity(Number(e.target.value))}
            placeholder="0"
            className="w-full px-2.5 py-1.5 border border-[#1A1A1A] dark:border-[#555] bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1] font-mono text-xs"
          />
          <p className="text-[9px] text-[#777] dark:text-[#999] mt-0.5">
            Holding ≤ 12 mo (Sec 111A)
          </p>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0]">
              LTCG Real Estate / Gold
            </label>
            <span className="text-[9px] text-blue-600 dark:text-sky-400 font-bold">
              12.5%
            </span>
          </div>
          <input
            type="number"
            min={0}
            value={ltcgOther || ""}
            onChange={(e) => setLtcgOther(Number(e.target.value))}
            placeholder="0"
            className="w-full px-2.5 py-1.5 border border-[#1A1A1A] dark:border-[#555] bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1] font-mono text-xs"
          />
          <p className="text-[9px] text-[#777] dark:text-[#999] mt-0.5">
            Holding &gt; 24 mo
          </p>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0]">
              Debt MFs / STCG Slab
            </label>
            <span className="text-[9px] text-[#666] dark:text-[#AAA] font-bold">
              Slab Rate
            </span>
          </div>
          <input
            type="number"
            min={0}
            value={stcgSlab || ""}
            onChange={(e) => setStcgSlab(Number(e.target.value))}
            placeholder="0"
            className="w-full px-2.5 py-1.5 border border-[#1A1A1A] dark:border-[#555] bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1] font-mono text-xs"
          />
          <p className="text-[9px] text-[#777] dark:text-[#999] mt-0.5">
            Taxed at normal income slabs
          </p>
        </div>
      </div>

      {/* Computation Summary Box */}
      <div className="border border-[#1A1A1A] dark:border-[#383838] bg-white dark:bg-[#161616] p-3 rounded-none font-mono text-xs space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dotted border-[#1A1A1A] dark:border-[#444] pb-2">
          <div className="flex items-center gap-1.5 text-[#2A4B3A] dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="font-bold">LTCG Exemption Utilized:</span>
          </div>
          <span className="font-bold">
            ₹{result.ltcg_exemption_used.toLocaleString("en-IN")} / ₹1,25,000
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
          <div className="flex justify-between sm:flex-col">
            <span className="text-[#666] dark:text-[#AAA]">
              Equity LTCG Tax (12.5%):
            </span>
            <span className="font-bold">
              ₹{result.ltcg_equity_tax.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex justify-between sm:flex-col">
            <span className="text-[#666] dark:text-[#AAA]">
              Equity STCG Tax (20%):
            </span>
            <span className="font-bold">
              ₹{result.stcg_equity_tax.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex justify-between sm:flex-col">
            <span className="text-[#666] dark:text-[#AAA]">
              Other Assets Tax (12.5%):
            </span>
            <span className="font-bold">
              ₹{result.ltcg_other_tax.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        <div className="border-t border-[#1A1A1A] dark:border-[#383838] pt-2 flex justify-between items-center text-xs">
          <span className="font-bold uppercase tracking-wider text-[#1A1A1A] dark:text-white">
            Total Capital Gains Tax Payable:
          </span>
          <span className="font-bold text-sm text-red-700 dark:text-rose-400">
            ₹{result.cg_tax.toLocaleString("en-IN")}
          </span>
        </div>
      </div>
    </div>
  );
}
