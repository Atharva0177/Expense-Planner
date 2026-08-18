import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getIncomes } from "../lib/db";
import { calculateNewRegime, calculateOldRegime, TaxBreakdown } from "../lib/taxUtils";
import { Calculator, Sparkles, Check } from "lucide-react";

export function TaxSection({ currentMonth }: { currentMonth: string }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Inputs
  const [grossIncome, setGrossIncome] = useState<number>(0);
  const [hraExemption, setHraExemption] = useState<number>(0);
  const [eightyC, setEightyC] = useState<number>(0);
  const [eightyD, setEightyD] = useState<number>(0);
  const [homeLoanInterest, setHomeLoanInterest] = useState<number>(0);
  const [otherDeductions, setOtherDeductions] = useState<number>(0);

  // Results
  const [oldRegime, setOldRegime] = useState<TaxBreakdown | null>(null);
  const [newRegime, setNewRegime] = useState<TaxBreakdown | null>(null);

  const fetchIncomeToAutoFill = async () => {
    if (!user) return;
    setLoading(true);
    const incomes = await getIncomes(user.uid, currentMonth);
    if (incomes && incomes.length > 0) {
      const entry = incomes[0];
      const monthlyGross = entry.basic + entry.hra + entry.special_allowance + entry.bonus + entry.other;
      setGrossIncome(monthlyGross * 12);
      setOtherDeductions((entry.professional_tax || 0) * 12);
    }
    setLoading(false);
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    
    const oldR = calculateOldRegime(
      grossIncome,
      hraExemption,
      eightyC,
      eightyD,
      homeLoanInterest,
      otherDeductions
    );
    const newR = calculateNewRegime(grossIncome);

    setOldRegime(oldR);
    setNewRegime(newR);
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* Input Section */}
      <div className="bg-white dark:bg-[#1A1A1A] border border-[#1A1A1A] dark:border-[#383838] p-4 sm:p-6 md:p-8 shadow-[4px_4px_0px_#1A1A1A] sm:shadow-[8px_8px_0px_#1A1A1A] dark:shadow-[8px_8px_0px_#000] relative">
        <span className="absolute -top-3 left-4 bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest">
          FY 25-26 Tax Comparison
        </span>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-5 border-b-2 border-[#1A1A1A] dark:border-[#383838] pb-3 gap-2 mt-1">
          <p className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0]">Annual Tax Estimation</p>
          <button 
            type="button"
            onClick={fetchIncomeToAutoFill} 
            className="text-[10px] uppercase font-bold tracking-widest text-[#2A4B3A] dark:text-emerald-400 border border-[#2A4B3A] dark:border-emerald-500 sm:border-0 sm:border-b bg-[#F0F5F2] dark:bg-emerald-950/40 sm:bg-transparent px-2 py-1 sm:px-0 sm:py-0 hover:opacity-75 transition-opacity inline-flex items-center gap-1 touch-manipulation"
          >
            <Sparkles className="w-3 h-3" />
            <span>{loading ? "Loading..." : "Auto-fill from current month Income"}</span>
          </button>
        </div>

        <form onSubmit={handleCalculate} className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">Gross Annual CTC / Income (₹)</label>
            <input 
              type="number" 
              required 
              min={0} 
              placeholder="e.g. 1200000"
              value={grossIncome || ''} 
              onChange={e => setGrossIncome(Number(e.target.value))} 
              className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none focus:border-[2px] dark:focus:border-white font-mono text-sm font-bold" 
            />
          </div>
          
          <div className="p-3 sm:p-4 border border-dashed border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424]">
            <p className="text-[10px] uppercase font-bold tracking-widest text-[#666] dark:text-[#A0A0A0] mb-3">
              Old Regime Specific Exemptions & Deductions
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">80C (Max 1.5L)</label>
                <input 
                  type="number" 
                  min={0} 
                  placeholder="0"
                  value={eightyC || ''} 
                  onChange={e => setEightyC(Number(e.target.value))} 
                  className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none focus:border-[2px] dark:focus:border-white font-mono text-xs" 
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">80D (Health Ins)</label>
                <input 
                  type="number" 
                  min={0} 
                  placeholder="0"
                  value={eightyD || ''} 
                  onChange={e => setEightyD(Number(e.target.value))} 
                  className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none focus:border-[2px] dark:focus:border-white font-mono text-xs" 
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">HRA Exemption</label>
                <input 
                  type="number" 
                  min={0} 
                  placeholder="0"
                  value={hraExemption || ''} 
                  onChange={e => setHraExemption(Number(e.target.value))} 
                  className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none focus:border-[2px] dark:focus:border-white font-mono text-xs" 
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">Home Loan Int (Sec 24b)</label>
                <input 
                  type="number" 
                  min={0} 
                  placeholder="0"
                  value={homeLoanInterest || ''} 
                  onChange={e => setHomeLoanInterest(Number(e.target.value))} 
                  className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none focus:border-[2px] dark:focus:border-white font-mono text-xs" 
                />
              </div>
              <div className="sm:col-span-2 md:col-span-2">
                <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">Other (PT, LTA, 80CCD)</label>
                <input 
                  type="number" 
                  min={0} 
                  placeholder="0"
                  value={otherDeductions || ''} 
                  onChange={e => setOtherDeductions(Number(e.target.value))} 
                  className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none focus:border-[2px] dark:focus:border-white font-mono text-xs" 
                />
              </div>
            </div>
          </div>

          <div>
            <button 
              type="submit" 
              className="w-full bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] py-2.5 px-4 font-bold uppercase tracking-widest text-xs hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors active:scale-95 touch-manipulation min-h-[38px] flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#777] dark:shadow-[2px_2px_0px_#000]"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Calculate & Compare Regimes</span>
            </button>
          </div>
        </form>
      </div>

      {/* Results Section */}
      {oldRegime && newRegime && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          
          <div className={`p-4 sm:p-6 md:p-8 border-2 ${oldRegime.total_tax < newRegime.total_tax ? 'border-[#2A4B3A] dark:border-emerald-500 bg-[#F0F5F2] dark:bg-emerald-950/20' : 'border-[#1A1A1A] dark:border-[#383838] bg-white dark:bg-[#1A1A1A]'} relative shadow-[4px_4px_0px_#1A1A1A] sm:shadow-[8px_8px_0px_#1A1A1A] dark:shadow-[8px_8px_0px_#000]`}>
            {oldRegime.total_tax < newRegime.total_tax && (
              <span className="absolute -top-3 left-4 bg-[#2A4B3A] dark:bg-emerald-600 text-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1">
                <Check className="w-3 h-3" /> Recommended
              </span>
            )}
            <h3 className="text-xl sm:text-2xl font-serif italic text-[#1A1A1A] dark:text-[#F0ECE1] mb-4 sm:mb-6 border-b border-[#1A1A1A] dark:border-[#383838] pb-2">
              Old Regime
            </h3>
            
            <div className="space-y-3 sm:space-y-4 text-xs font-mono text-[#1A1A1A] dark:text-[#F0ECE1]">
              <div className="flex justify-between border-b border-dotted border-[#1A1A1A] dark:border-[#444] pb-1">
                <span>Gross Income</span>
                <span>₹{oldRegime.gross_income.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-dotted border-[#1A1A1A] dark:border-[#444] pb-1 text-[#666] dark:text-[#A0A0A0]">
                <span>Total Deductions (Inc. ₹50k Std)</span>
                <span>- ₹{oldRegime.total_deductions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-dotted border-[#1A1A1A] dark:border-[#444] pb-1">
                <span>Net Taxable</span>
                <span>₹{oldRegime.taxable_income.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-[#1A1A1A] dark:border-[#383838] pb-1 mt-3">
                <span className="font-bold">Tax + 4% Cess</span>
                <span className="font-bold text-red-700 dark:text-rose-400">₹{oldRegime.total_tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base sm:text-lg font-serif italic pt-2 font-bold text-green-900 dark:text-emerald-400 border-t-2 border-[#1A1A1A] dark:border-[#383838]">
                <span>Monthly Take-Home</span>
                <span>₹{oldRegime.monthly_take_home.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className={`p-4 sm:p-6 md:p-8 border-2 ${newRegime.total_tax <= oldRegime.total_tax ? 'border-[#2A4B3A] dark:border-emerald-500 bg-[#F0F5F2] dark:bg-emerald-950/20' : 'border-[#1A1A1A] dark:border-[#383838] bg-white dark:bg-[#1A1A1A]'} relative shadow-[4px_4px_0px_#1A1A1A] sm:shadow-[8px_8px_0px_#1A1A1A] dark:shadow-[8px_8px_0px_#000]`}>
            {newRegime.total_tax <= oldRegime.total_tax && (
              <span className="absolute -top-3 left-4 bg-[#2A4B3A] dark:bg-emerald-600 text-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1">
                <Check className="w-3 h-3" /> Recommended
              </span>
            )}
            <h3 className="text-xl sm:text-2xl font-serif italic text-[#1A1A1A] dark:text-[#F0ECE1] mb-4 sm:mb-6 border-b border-[#1A1A1A] dark:border-[#383838] pb-2">
              New Regime (Default)
            </h3>
            
            <div className="space-y-3 sm:space-y-4 text-xs font-mono text-[#1A1A1A] dark:text-[#F0ECE1]">
              <div className="flex justify-between border-b border-dotted border-[#1A1A1A] dark:border-[#444] pb-1">
                <span>Gross Income</span>
                <span>₹{newRegime.gross_income.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-dotted border-[#1A1A1A] dark:border-[#444] pb-1 text-[#666] dark:text-[#A0A0A0]">
                <span>Total Deductions (₹75k Std)</span>
                <span>- ₹{newRegime.total_deductions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-dotted border-[#1A1A1A] dark:border-[#444] pb-1">
                <span>Net Taxable</span>
                <span>₹{newRegime.taxable_income.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-[#1A1A1A] dark:border-[#383838] pb-1 mt-3">
                <span className="font-bold">Tax + 4% Cess</span>
                <span className="font-bold text-red-700 dark:text-rose-400">₹{newRegime.total_tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base sm:text-lg font-serif italic pt-2 font-bold text-green-900 dark:text-emerald-400 border-t-2 border-[#1A1A1A] dark:border-[#383838]">
                <span>Monthly Take-Home</span>
                <span>₹{newRegime.monthly_take_home.toLocaleString()}</span>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
