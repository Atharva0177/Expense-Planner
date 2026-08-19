import React, { useState, useEffect } from "react";
import { useAuth } from "../../src/contexts/AuthContext";
import {
  getIncomes,
  getTaxCalculations,
  saveTaxCalculation,
  deleteTaxCalculation,
} from "../lib/db";
import {
  calculateIndianTaxMaster,
  IndianTaxInputs,
  TaxComparisonResult,
} from "../lib/taxUtils";
import { HraCalculatorModal } from "./tax/HraCalculatorModal";
import { CapitalGainsCalculator } from "./tax/CapitalGainsCalculator";
import { AdvanceTaxPlanner } from "./tax/AdvanceTaxPlanner";
import { TaxFilingSummaryModal } from "./tax/TaxFilingSummaryModal";
import {
  Calculator,
  Sparkles,
  Check,
  Home,
  TrendingUp,
  Calendar,
  ShieldCheck,
  Bookmark,
  FileText,
  Trash2,
  Info,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

export function TaxSection({ currentMonth }: { currentMonth: string }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Financial Year Selector
  const [financialYear, setFinancialYear] = useState<
    "2024-25" | "2025-26" | "2026-27"
  >("2024-25");
  const [ageCategory, setAgeCategory] = useState<
    "general" | "senior" | "super_senior"
  >("general");

  // Income States
  const [grossSalary, setGrossSalary] = useState<number>(1200000);
  const [basicSalary, setBasicSalary] = useState<number>(600000);
  const [hraReceived, setHraReceived] = useState<number>(240000);
  const [rentalIncome, setRentalIncome] = useState<number>(0);
  const [savingsInterest, setSavingsInterest] = useState<number>(0);
  const [fdInterest, setFdInterest] = useState<number>(0);
  const [otherIncome, setOtherIncome] = useState<number>(0);

  // Capital Gains
  const [stcgEquity, setStcgEquity] = useState<number>(0);
  const [ltcgEquity, setLtcgEquity] = useState<number>(0);
  const [ltcgOther, setLtcgOther] = useState<number>(0);
  const [stcgSlab, setStcgSlab] = useState<number>(0);

  // Deductions for Old Regime
  const [hraExemption, setHraExemption] = useState<number>(0);
  const [rentPaid, setRentPaid] = useState<number>(0);
  const [isMetro, setIsMetro] = useState<boolean>(true);
  const [eightyC, setEightyC] = useState<number>(150000);
  const [eightyCCD1B, setEightyCCD1B] = useState<number>(50000);
  const [eightyCCD2, setEightyCCD2] = useState<number>(0);
  const [eightyDSelf, setEightyDSelf] = useState<number>(25000);
  const [eightyDParents, setEightyDParents] = useState<number>(25000);
  const [homeLoanInterest, setHomeLoanInterest] = useState<number>(0);
  const [eightyE, setEightyE] = useState<number>(0);
  const [eightyG, setEightyG] = useState<number>(0);
  const [otherDeductions, setOtherDeductions] = useState<number>(2400); // Standard Professional tax

  // Taxes Paid / TDS
  const [tdsDeducted, setTdsDeducted] = useState<number>(0);
  const [advanceTaxPaid, setAdvanceTaxPaid] = useState<number>(0);

  // Modals & Accordions
  const [isHraModalOpen, setIsHraModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [showAdvancedIncome, setShowAdvancedIncome] = useState(false);
  const [showCapitalGains, setShowCapitalGains] = useState(false);
  const [showAdvanceTax, setShowAdvanceTax] = useState(false);
  const [showSlabDetails, setShowSlabDetails] = useState(false);

  // Saved Tax Plans from Firestore
  const [savedPlans, setSavedPlans] = useState<any[]>([]);

  // Compute live tax comparison
  const taxInputs: IndianTaxInputs = {
    financial_year: financialYear,
    age_category: ageCategory,
    gross_salary: grossSalary,
    basic_salary: basicSalary,
    hra_received: hraReceived,
    rental_income: rentalIncome,
    savings_interest: savingsInterest,
    fd_interest: fdInterest,
    other_income: otherIncome,
    stcg_equity: stcgEquity,
    ltcg_equity: ltcgEquity,
    ltcg_other: ltcgOther,
    stcg_slab: stcgSlab,
    is_salaried: true,
    rent_paid: rentPaid,
    is_metro: isMetro,
    hra_exemption_override: hraExemption > 0 ? hraExemption : undefined,
    eighty_c: eightyC,
    eighty_ccd_1b: eightyCCD1B,
    eighty_ccd_2: eightyCCD2,
    eighty_d_self: eightyDSelf,
    eighty_d_parents: eightyDParents,
    home_loan_interest: homeLoanInterest,
    eighty_e: eightyE,
    eighty_g: eightyG,
    eighty_tta_ttb: savingsInterest,
    other_deductions: otherDeductions,
    tds_deducted: tdsDeducted,
    advance_tax_paid: advanceTaxPaid,
  };

  const result: TaxComparisonResult = calculateIndianTaxMaster(taxInputs);

  // Fetch saved plans on mount
  useEffect(() => {
    if (!user) return;
    loadSavedPlans();
  }, [user]);

  const loadSavedPlans = async () => {
    if (!user) return;
    try {
      const plans = await getTaxCalculations(user.uid);
      setSavedPlans(plans || []);
    } catch (e) {
      console.warn("Could not load tax plans:", e);
    }
  };

  // Auto-fill from recorded monthly salary in IncomeSection
  const fetchIncomeToAutoFill = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const incomes = await getIncomes(user.uid, currentMonth);
      if (incomes && incomes.length > 0) {
        const entry = incomes[0];
        const monthlyGross =
          entry.basic +
          entry.hra +
          entry.special_allowance +
          entry.bonus +
          entry.other;
        const annualGross = monthlyGross * 12;
        const annualBasic = (entry.basic || 0) * 12;
        const annualHra = (entry.hra || 0) * 12;
        const annualPt = (entry.professional_tax || 0) * 12;
        const annualEpf = (entry.epf_deduction || 0) * 12;
        const annualTds = (entry.tds || 0) * 12;

        setGrossSalary(annualGross);
        setBasicSalary(annualBasic > 0 ? annualBasic : annualGross * 0.5);
        setHraReceived(annualHra);
        setOtherDeductions(annualPt || 2400);
        if (annualEpf > 0) {
          setEightyC(Math.min(150000, annualEpf));
        }
        setTdsDeducted(annualTds);

        setSaveStatus("Values auto-filled from current month payslip!");
        setTimeout(() => setSaveStatus(null), 4000);
      } else {
        setSaveStatus(
          "No income entry found for current month. Please enter manually.",
        );
        setTimeout(() => setSaveStatus(null), 4000);
      }
    } catch (e) {
      console.warn("Auto-fill error:", e);
    }
    setLoading(false);
  };

  const handleSavePlan = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await saveTaxCalculation({
        user_id: user.uid,
        financial_year: financialYear,
        gross_salary: grossSalary,
        business_income: 0,
        rental_income: rentalIncome,
        interest_income: savingsInterest + fdInterest,
        other_income: otherIncome,
        stcg_equity: stcgEquity,
        ltcg_equity: ltcgEquity,
        stcg_other: stcgSlab,
        ltcg_other: ltcgOther,
        hra_exemption: hraExemption,
        standard_deduction: result.recommended_regime === "new" ? 75000 : 50000,
        eighty_c: eightyC,
        eighty_d: eightyDSelf + eightyDParents,
        eighty_ccd_1b: eightyCCD1B,
        eighty_ccd_2: eightyCCD2,
        eighty_e: eightyE,
        eighty_g: eightyG,
        eighty_tta_ttb: savingsInterest,
        home_loan_interest: homeLoanInterest,
        other_deductions: otherDeductions,
        old_regime_tax: result.old_regime.total_tax,
        new_regime_tax: result.new_regime.total_tax,
        old_regime_cess: result.old_regime.cess,
        new_regime_cess: result.new_regime.cess,
        old_regime_rebate: result.old_regime.rebate_87a,
        new_regime_rebate: result.new_regime.rebate_87a,
        recommended_regime: result.recommended_regime,
        breakeven_deduction: result.breakeven_deductions,
        tds_deducted: tdsDeducted,
        advance_tax_paid: advanceTaxPaid,
        net_tax_payable_or_refund: result.net_payable_or_refund.balance,
      });
      setSaveStatus("Tax Calculation Plan saved to your account!");
      await loadSavedPlans();
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err: any) {
      setSaveStatus("Failed to save tax plan: " + err.message);
    }
    setLoading(false);
  };

  const handleDeleteSavedPlan = async (id: string) => {
    try {
      await deleteTaxCalculation(id);
      await loadSavedPlans();
    } catch (e) {
      console.warn("Delete error:", e);
    }
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8 animate-in fade-in">
      {/* Top Banner & Financial Year Selection */}
      <div className="bg-white dark:bg-[#1A1A1A] border border-[#1A1A1A] dark:border-[#383838] p-4 sm:p-6 md:p-8 shadow-[4px_4px_0px_#1A1A1A] sm:shadow-[8px_8px_0px_#1A1A1A] dark:shadow-[8px_8px_0px_#000] relative">
        <span className="absolute -top-3 left-4 bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest">
          Direct Tax Planning Engine (Budget 2024 / FY 2024-25 & FY 2025-26)
        </span>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 border-b-2 border-[#1A1A1A] dark:border-[#383838] pb-4 gap-4 mt-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif italic text-[#1A1A1A] dark:text-[#F0ECE1]">
              Income Tax & Regime Comparison
            </h2>
            <p className="text-[10px] uppercase font-bold tracking-widest text-[#777] dark:text-[#999] mt-0.5">
              Comprehensive Analysis for Salaried, Business & Capital Gains
              Taxpayers
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Financial Year Selector */}
            <div className="flex items-center gap-1 border border-[#1A1A1A] dark:border-[#555] bg-[#FCFAF7] dark:bg-[#242424] p-1 font-mono text-xs">
              <span className="text-[9px] uppercase font-bold text-[#666] dark:text-[#AAA] px-1">
                FY:
              </span>
              {(["2024-25", "2025-26"] as const).map((fy) => (
                <button
                  key={fy}
                  type="button"
                  onClick={() => setFinancialYear(fy)}
                  className={`px-2 py-1 text-[10px] font-bold uppercase ${
                    financialYear === fy
                      ? "bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212]"
                      : "text-[#1A1A1A] dark:text-[#CCC] hover:bg-gray-200 dark:hover:bg-gray-800"
                  }`}
                >
                  {fy}
                </button>
              ))}
            </div>

            {/* Age Category Selector */}
            <select
              value={ageCategory}
              onChange={(e) => setAgeCategory(e.target.value as any)}
              className="px-2.5 py-1.5 border border-[#1A1A1A] dark:border-[#555] bg-[#FCFAF7] dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] font-mono text-xs font-bold"
            >
              <option value="general">Below 60 yrs (Regular)</option>
              <option value="senior">60-80 yrs (Senior Citizen)</option>
              <option value="super_senior">&gt;80 yrs (Super Senior)</option>
            </select>

            {/* Auto-Fill Button */}
            <button
              type="button"
              onClick={fetchIncomeToAutoFill}
              disabled={loading}
              className="px-3 py-1.5 bg-[#2A4B3A] dark:bg-emerald-700 text-white font-mono text-[10px] uppercase font-bold tracking-wider hover:opacity-90 flex items-center gap-1.5 shadow-[2px_2px_0px_#1A1A1A]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{loading ? "Loading..." : "Auto-fill from Payslip"}</span>
            </button>
          </div>
        </div>

        {saveStatus && (
          <div className="mb-4 p-2.5 bg-[#F0F5F2] dark:bg-emerald-950/40 border border-[#2A4B3A] dark:border-emerald-600 text-[#2A4B3A] dark:text-emerald-300 font-mono text-xs flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>{saveStatus}</span>
          </div>
        )}

        {/* 1. Core Primary Income Form */}
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 font-mono">
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                Gross Annual CTC / Salary (₹)
              </label>
              <input
                type="number"
                min={0}
                required
                value={grossSalary || ""}
                onChange={(e) => setGrossSalary(Number(e.target.value))}
                placeholder="e.g. 1200000"
                className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] font-mono text-sm font-bold focus:outline-none focus:border-[2px]"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                Annual Basic Salary + DA (₹)
              </label>
              <input
                type="number"
                min={0}
                value={basicSalary || ""}
                onChange={(e) => setBasicSalary(Number(e.target.value))}
                placeholder="e.g. 600000"
                className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1] font-mono text-xs"
              />
              <p className="text-[9px] text-[#777] dark:text-[#999] mt-0.5">
                Basis for HRA and NPS calculations
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0]">
                  HRA Exemption (₹)
                </label>
                <button
                  type="button"
                  onClick={() => setIsHraModalOpen(true)}
                  className="text-[9px] uppercase font-bold text-blue-600 dark:text-sky-400 hover:underline flex items-center gap-0.5"
                >
                  <Home className="w-2.5 h-2.5" />
                  <span>Calculator</span>
                </button>
              </div>
              <input
                type="number"
                min={0}
                value={hraExemption || ""}
                onChange={(e) => setHraExemption(Number(e.target.value))}
                placeholder="0"
                className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1] font-mono text-xs"
              />
              <p className="text-[9px] text-[#777] dark:text-[#999] mt-0.5">
                Tax-exempt rent allowance under Sec 10(13A)
              </p>
            </div>
          </div>

          {/* 2. Deductions Section (Old & New Regime) */}
          <div className="p-3 sm:p-4 border border-dashed border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424]">
            <div className="flex justify-between items-center mb-3">
              <p className="text-[10px] uppercase font-bold tracking-widest text-[#666] dark:text-[#A0A0A0]">
                Exemptions & Chapter VI-A Deductions
              </p>
              <span className="text-[9px] font-mono text-[#888]">
                Standard Deduction: ₹75,000 (New) | ₹50,000 (Old)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 font-mono text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                  80C (PPF/EPF/ELSS/LIC)
                </label>
                <input
                  type="number"
                  min={0}
                  max={150000}
                  value={eightyC || ""}
                  onChange={(e) => setEightyC(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-2.5 py-1.5 border border-[#1A1A1A] dark:border-[#444] bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1] text-xs font-bold"
                />
                <p className="text-[9px] text-[#777] dark:text-[#999] mt-0.5">
                  Max ₹1.5 Lakh
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                  80CCD(1B) NPS (Self)
                </label>
                <input
                  type="number"
                  min={0}
                  max={50000}
                  value={eightyCCD1B || ""}
                  onChange={(e) => setEightyCCD1B(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-2.5 py-1.5 border border-[#1A1A1A] dark:border-[#444] bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1] text-xs"
                />
                <p className="text-[9px] text-[#777] dark:text-[#999] mt-0.5">
                  Exclusive NPS ₹50,000
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                  80D Health Insurance
                </label>
                <input
                  type="number"
                  min={0}
                  value={eightyDSelf + eightyDParents || ""}
                  onChange={(e) => setEightyDSelf(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-2.5 py-1.5 border border-[#1A1A1A] dark:border-[#444] bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1] text-xs"
                />
                <p className="text-[9px] text-[#777] dark:text-[#999] mt-0.5">
                  Self + Parents (₹25k-₹1L)
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                  Home Loan Int (Sec 24b)
                </label>
                <input
                  type="number"
                  min={0}
                  max={200000}
                  value={homeLoanInterest || ""}
                  onChange={(e) => setHomeLoanInterest(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-2.5 py-1.5 border border-[#1A1A1A] dark:border-[#444] bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1] text-xs"
                />
                <p className="text-[9px] text-[#777] dark:text-[#999] mt-0.5">
                  Max ₹2 Lakh (Self Occupied)
                </p>
              </div>
            </div>

            {/* Expandable Advanced Deductions */}
            <div className="mt-3 pt-2 border-t border-dotted border-[#1A1A1A] dark:border-[#444]">
              <button
                type="button"
                onClick={() => setShowAdvancedIncome(!showAdvancedIncome)}
                className="text-[10px] uppercase font-bold text-[#1A1A1A] dark:text-[#CCC] hover:underline flex items-center gap-1"
              >
                {showAdvancedIncome ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
                <span>
                  {showAdvancedIncome
                    ? "Hide Advanced Incomes & Deductions"
                    : "Show More Deductions (NPS Employer 80CCD(2), 80E, 80G, Interest)"}
                </span>
              </button>

              {showAdvancedIncome && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-3 animate-in fade-in font-mono text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                      Employer NPS (80CCD(2))
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={eightyCCD2 || ""}
                      onChange={(e) => setEightyCCD2(Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 border border-[#1A1A1A] dark:border-[#444] bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1] text-xs"
                    />
                    <p className="text-[9px] text-[#777] dark:text-[#999] mt-0.5">
                      Eligible in New Regime (14% Basic)
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                      Education Loan Int (80E)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={eightyE || ""}
                      onChange={(e) => setEightyE(Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 border border-[#1A1A1A] dark:border-[#444] bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1] text-xs"
                    />
                    <p className="text-[9px] text-[#777] dark:text-[#999] mt-0.5">
                      100% deduction for 8 years
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                      Donations (Sec 80G)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={eightyG || ""}
                      onChange={(e) => setEightyG(Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 border border-[#1A1A1A] dark:border-[#444] bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1] text-xs"
                    />
                    <p className="text-[9px] text-[#777] dark:text-[#999] mt-0.5">
                      PMNRF, Clean Ganga, etc.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                      Savings & Other Int (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={savingsInterest || ""}
                      onChange={(e) =>
                        setSavingsInterest(Number(e.target.value))
                      }
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 border border-[#1A1A1A] dark:border-[#444] bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1] text-xs"
                    />
                    <p className="text-[9px] text-[#777] dark:text-[#999] mt-0.5">
                      80TTA exempts up to ₹10k
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. Capital Gains Module Toggle */}
          <div className="border border-[#1A1A1A] dark:border-[#444]">
            <button
              type="button"
              onClick={() => setShowCapitalGains(!showCapitalGains)}
              className="w-full p-3 bg-[#FCFAF7] dark:bg-[#202020] flex justify-between items-center text-xs font-mono font-bold uppercase tracking-wider text-[#1A1A1A] dark:text-[#F0ECE1] hover:bg-gray-100 dark:hover:bg-[#282828]"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                <span>
                  Capital Gains Calculator (Equity 12.5% LTCG, 20% STCG)
                </span>
              </div>
              <span className="text-[10px] text-[#666] dark:text-[#AAA]">
                {showCapitalGains ? "Hide ▲" : "Expand ▼"}
              </span>
            </button>

            {showCapitalGains && (
              <CapitalGainsCalculator
                stcgEquity={stcgEquity}
                setStcgEquity={setStcgEquity}
                ltcgEquity={ltcgEquity}
                setLtcgEquity={setLtcgEquity}
                ltcgOther={ltcgOther}
                setLtcgOther={setLtcgOther}
                stcgSlab={stcgSlab}
                setStcgSlab={setStcgSlab}
              />
            )}
          </div>

          {/* 4. Advance Tax & TDS Planner Toggle */}
          <div className="border border-[#1A1A1A] dark:border-[#444]">
            <button
              type="button"
              onClick={() => setShowAdvanceTax(!showAdvanceTax)}
              className="w-full p-3 bg-[#FCFAF7] dark:bg-[#202020] flex justify-between items-center text-xs font-mono font-bold uppercase tracking-wider text-[#1A1A1A] dark:text-[#F0ECE1] hover:bg-gray-100 dark:hover:bg-[#282828]"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#2A4B3A] dark:text-emerald-400" />
                <span>Advance Tax Schedule & TDS Reconciliation</span>
              </div>
              <span className="text-[10px] text-[#666] dark:text-[#AAA]">
                {showAdvanceTax ? "Hide ▲" : "Expand ▼"}
              </span>
            </button>

            {showAdvanceTax && (
              <AdvanceTaxPlanner
                schedule={result.advance_tax_schedule}
                netAdvanceTax={result.net_payable_or_refund.balance}
                tdsDeducted={tdsDeducted}
                setTdsDeducted={setTdsDeducted}
                advanceTaxPaid={advanceTaxPaid}
                setAdvanceTaxPaid={setAdvanceTaxPaid}
                totalTaxLiability={
                  result.recommended_regime === "new"
                    ? result.new_regime.total_tax
                    : result.old_regime.total_tax
                }
              />
            )}
          </div>
        </div>
      </div>

      {/* Main Results: Side-by-Side Regime Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* NEW REGIME CARD (DEFAULT) */}
        <div
          className={`p-4 sm:p-6 md:p-8 border-2 ${
            result.recommended_regime === "new"
              ? "border-[#2A4B3A] dark:border-emerald-500 bg-[#F0F5F2] dark:bg-emerald-950/20"
              : "border-[#1A1A1A] dark:border-[#383838] bg-white dark:bg-[#1A1A1A]"
          } relative shadow-[4px_4px_0px_#1A1A1A] sm:shadow-[8px_8px_0px_#1A1A1A] dark:shadow-[8px_8px_0px_#000] flex flex-col justify-between`}
        >
          {result.recommended_regime === "new" && (
            <span className="absolute -top-3 left-4 bg-[#2A4B3A] dark:bg-emerald-600 text-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1 font-mono">
              <Check className="w-3 h-3" /> Recommended (Saves ₹
              {result.tax_difference.toLocaleString("en-IN")})
            </span>
          )}

          <div>
            <div className="flex justify-between items-start border-b border-[#1A1A1A] dark:border-[#383838] pb-3 mb-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-serif italic text-[#1A1A1A] dark:text-[#F0ECE1]">
                  New Tax Regime (Sec 115BAC)
                </h3>
                <span className="text-[9px] uppercase font-mono tracking-widest text-[#666] dark:text-[#AAA]">
                  Default Regime • FY {financialYear}
                </span>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-1 bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212]">
                {result.new_regime.effective_tax_rate}% Effective Tax
              </span>
            </div>

            <div className="space-y-2.5 font-mono text-xs text-[#1A1A1A] dark:text-[#F0ECE1]">
              <div className="flex justify-between border-b border-dotted border-[#1A1A1A] dark:border-[#444] pb-1">
                <span>Gross Income (Salary + Other)</span>
                <span className="font-bold">
                  ₹{result.new_regime.gross_income.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex justify-between border-b border-dotted border-[#1A1A1A] dark:border-[#444] pb-1 text-[#2A4B3A] dark:text-emerald-400">
                <span>Total Deductions (Std ₹75k + NPS 14%)</span>
                <span>
                  - ₹
                  {result.new_regime.total_deductions.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex justify-between border-b border-dotted border-[#1A1A1A] dark:border-[#444] pb-1">
                <span className="font-bold">Net Taxable Income</span>
                <span className="font-bold">
                  ₹{result.new_regime.taxable_income.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex justify-between border-b border-dotted border-[#1A1A1A] dark:border-[#444] pb-1 text-[#555] dark:text-[#AAA]">
                <span>Slab Computed Tax</span>
                <span>
                  ₹
                  {(
                    result.new_regime.slab_tax + result.new_regime.rebate_87a
                  ).toLocaleString("en-IN")}
                </span>
              </div>

              {result.new_regime.rebate_87a > 0 && (
                <div className="flex justify-between border-b border-dotted border-[#1A1A1A] dark:border-[#444] pb-1 text-emerald-600 dark:text-emerald-400">
                  <span>Section 87A Tax Rebate (Up to ₹7L)</span>
                  <span>
                    - ₹{result.new_regime.rebate_87a.toLocaleString("en-IN")}
                  </span>
                </div>
              )}

              {result.new_regime.marginal_relief_87a > 0 && (
                <div className="flex justify-between border-b border-dotted border-[#1A1A1A] dark:border-[#444] pb-1 text-emerald-600 dark:text-emerald-400">
                  <span>87A Marginal Relief</span>
                  <span>
                    - ₹
                    {result.new_regime.marginal_relief_87a.toLocaleString(
                      "en-IN",
                    )}
                  </span>
                </div>
              )}

              {result.new_regime.capital_gains_tax > 0 && (
                <div className="flex justify-between border-b border-dotted border-[#1A1A1A] dark:border-[#444] pb-1 text-blue-600 dark:text-sky-400">
                  <span>Capital Gains Tax</span>
                  <span>
                    + ₹
                    {result.new_regime.capital_gains_tax.toLocaleString(
                      "en-IN",
                    )}
                  </span>
                </div>
              )}

              <div className="flex justify-between border-b border-dotted border-[#1A1A1A] dark:border-[#444] pb-1">
                <span>Health & Education Cess (4%)</span>
                <span>+ ₹{result.new_regime.cess.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex justify-between border-b-2 border-[#1A1A1A] dark:border-[#383838] pt-2 pb-1 text-sm font-bold">
                <span>Total Annual Tax Liability:</span>
                <span className="text-red-700 dark:text-rose-400">
                  ₹{result.new_regime.total_tax.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1A1A1A] dark:border-[#383838] flex justify-between items-center">
            <span className="font-mono text-xs uppercase font-bold text-[#666] dark:text-[#AAA]">
              Monthly Take-Home:
            </span>
            <span className="font-serif italic text-lg sm:text-xl font-bold text-green-900 dark:text-emerald-400">
              ₹{result.new_regime.monthly_take_home.toLocaleString("en-IN")}/mo
            </span>
          </div>
        </div>

        {/* OLD REGIME CARD */}
        <div
          className={`p-4 sm:p-6 md:p-8 border-2 ${
            result.recommended_regime === "old"
              ? "border-[#2A4B3A] dark:border-emerald-500 bg-[#F0F5F2] dark:bg-emerald-950/20"
              : "border-[#1A1A1A] dark:border-[#383838] bg-white dark:bg-[#1A1A1A]"
          } relative shadow-[4px_4px_0px_#1A1A1A] sm:shadow-[8px_8px_0px_#1A1A1A] dark:shadow-[8px_8px_0px_#000] flex flex-col justify-between`}
        >
          {result.recommended_regime === "old" && (
            <span className="absolute -top-3 left-4 bg-[#2A4B3A] dark:bg-emerald-600 text-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1 font-mono">
              <Check className="w-3 h-3" /> Recommended (Saves ₹
              {result.tax_difference.toLocaleString("en-IN")})
            </span>
          )}

          <div>
            <div className="flex justify-between items-start border-b border-[#1A1A1A] dark:border-[#383838] pb-3 mb-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-serif italic text-[#1A1A1A] dark:text-[#F0ECE1]">
                  Old Tax Regime (With Deductions)
                </h3>
                <span className="text-[9px] uppercase font-mono tracking-widest text-[#666] dark:text-[#AAA]">
                  Optional Regime • 80C, 80D, HRA, 24(b)
                </span>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-1 bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212]">
                {result.old_regime.effective_tax_rate}% Effective Tax
              </span>
            </div>

            <div className="space-y-2.5 font-mono text-xs text-[#1A1A1A] dark:text-[#F0ECE1]">
              <div className="flex justify-between border-b border-dotted border-[#1A1A1A] dark:border-[#444] pb-1">
                <span>Gross Income (Salary + Other)</span>
                <span className="font-bold">
                  ₹{result.old_regime.gross_income.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex justify-between border-b border-dotted border-[#1A1A1A] dark:border-[#444] pb-1 text-[#2A4B3A] dark:text-emerald-400">
                <span>Total Deductions & Exemptions</span>
                <span>
                  - ₹
                  {result.old_regime.total_deductions.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex justify-between border-b border-dotted border-[#1A1A1A] dark:border-[#444] pb-1">
                <span className="font-bold">Net Taxable Income</span>
                <span className="font-bold">
                  ₹{result.old_regime.taxable_income.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex justify-between border-b border-dotted border-[#1A1A1A] dark:border-[#444] pb-1 text-[#555] dark:text-[#AAA]">
                <span>Slab Computed Tax</span>
                <span>
                  ₹
                  {(
                    result.old_regime.slab_tax + result.old_regime.rebate_87a
                  ).toLocaleString("en-IN")}
                </span>
              </div>

              {result.old_regime.rebate_87a > 0 && (
                <div className="flex justify-between border-b border-dotted border-[#1A1A1A] dark:border-[#444] pb-1 text-emerald-600 dark:text-emerald-400">
                  <span>Section 87A Tax Rebate (Up to ₹5L)</span>
                  <span>
                    - ₹{result.old_regime.rebate_87a.toLocaleString("en-IN")}
                  </span>
                </div>
              )}

              {result.old_regime.capital_gains_tax > 0 && (
                <div className="flex justify-between border-b border-dotted border-[#1A1A1A] dark:border-[#444] pb-1 text-blue-600 dark:text-sky-400">
                  <span>Capital Gains Tax</span>
                  <span>
                    + ₹
                    {result.old_regime.capital_gains_tax.toLocaleString(
                      "en-IN",
                    )}
                  </span>
                </div>
              )}

              <div className="flex justify-between border-b border-dotted border-[#1A1A1A] dark:border-[#444] pb-1">
                <span>Health & Education Cess (4%)</span>
                <span>+ ₹{result.old_regime.cess.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex justify-between border-b-2 border-[#1A1A1A] dark:border-[#383838] pt-2 pb-1 text-sm font-bold">
                <span>Total Annual Tax Liability:</span>
                <span className="text-red-700 dark:text-rose-400">
                  ₹{result.old_regime.total_tax.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1A1A1A] dark:border-[#383838] flex justify-between items-center">
            <span className="font-mono text-xs uppercase font-bold text-[#666] dark:text-[#AAA]">
              Monthly Take-Home:
            </span>
            <span className="font-serif italic text-lg sm:text-xl font-bold text-green-900 dark:text-emerald-400">
              ₹{result.old_regime.monthly_take_home.toLocaleString("en-IN")}/mo
            </span>
          </div>
        </div>
      </div>

      {/* 5. Breakeven Deductions & AI Planning Recommendations */}
      <div className="bg-white dark:bg-[#1A1A1A] border border-[#1A1A1A] dark:border-[#383838] p-4 sm:p-6 shadow-[4px_4px_0px_#1A1A1A] dark:shadow-[6px_6px_0px_#000] font-mono space-y-4">
        <div className="flex items-center gap-2 border-b border-[#1A1A1A] dark:border-[#383838] pb-2">
          <ShieldCheck className="w-5 h-5 text-[#2A4B3A] dark:text-emerald-400" />
          <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-[#1A1A1A] dark:text-[#F0ECE1]">
            Breakeven Analysis & Tax Optimization Insights
          </h3>
        </div>

        <div className="p-3 bg-[#FCFAF7] dark:bg-[#242424] border border-dashed border-[#1A1A1A] dark:border-[#444] text-xs space-y-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <span className="font-bold text-[#1A1A1A] dark:text-white uppercase text-[10px] block">
                Breakeven Deduction Threshold:
              </span>
              <span className="text-sm font-bold text-blue-700 dark:text-sky-400">
                ₹{result.breakeven_deductions.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="text-right sm:text-right">
              <span className="font-bold text-[#666] dark:text-[#AAA] uppercase text-[10px] block">
                Your Current Old Regime Deductions:
              </span>
              <span className="text-sm font-bold text-[#1A1A1A] dark:text-white">
                ₹{result.current_old_deductions.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-[#555] dark:text-[#AAA] leading-relaxed">
            {result.current_old_deductions >= result.breakeven_deductions
              ? `✓ Your deductions (₹${result.current_old_deductions.toLocaleString("en-IN")}) exceed the breakeven point (₹${result.breakeven_deductions.toLocaleString("en-IN")}), making the Old Regime more profitable for you.`
              : `→ You need an additional ₹${(result.breakeven_deductions - result.current_old_deductions).toLocaleString("en-IN")} in deductions to make the Old Regime cheaper than the New Regime.`}
          </p>
        </div>

        {/* Actionable Recommendations List */}
        <div className="space-y-2 text-xs">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#888]">
            Key Action Items for Tax Savings:
          </p>
          <div className="space-y-1.5">
            {result.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2 bg-[#FCFAF7] dark:bg-[#202020] border border-[#EBE7DF] dark:border-[#333]"
              >
                <ArrowRight className="w-3.5 h-3.5 shrink-0 text-[#2A4B3A] dark:text-emerald-400 mt-0.5" />
                <span className="text-[#333] dark:text-[#DDD] text-[11px] leading-relaxed">
                  {rec}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons: Save Plan & View Full Computation Sheet */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#1A1A1A] dark:border-[#383838]">
          <button
            type="button"
            onClick={handleSavePlan}
            disabled={loading}
            className="px-4 py-2 bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] font-mono text-xs uppercase font-bold tracking-wider hover:opacity-90 flex items-center gap-2 shadow-[2px_2px_0px_#777] dark:shadow-[2px_2px_0px_#000]"
          >
            <Bookmark className="w-4 h-4" />
            <span>Save Tax Plan</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSummaryModalOpen(true)}
            className="px-4 py-2 border-2 border-[#1A1A1A] dark:border-white bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-white font-mono text-xs uppercase font-bold tracking-wider hover:bg-gray-100 dark:hover:bg-[#252525] flex items-center gap-2 shadow-[2px_2px_0px_#1A1A1A]"
          >
            <FileText className="w-4 h-4" />
            <span>View & Print Tax Sheet (ITR Summary)</span>
          </button>
        </div>
      </div>

      {/* 6. Saved Tax Plans History */}
      {savedPlans.length > 0 && (
        <div className="bg-white dark:bg-[#1A1A1A] border border-[#1A1A1A] dark:border-[#383838] p-4 sm:p-6 font-mono space-y-3 shadow-[4px_4px_0px_#1A1A1A]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] dark:text-[#F0ECE1] border-b border-[#EBE7DF] dark:border-[#333] pb-2">
            Saved Tax Projections & Records ({savedPlans.length})
          </h4>

          <div className="divide-y divide-[#EBE7DF] dark:divide-[#2E2E2E]">
            {savedPlans.map((plan) => (
              <div
                key={plan.id}
                className="py-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs"
              >
                <div>
                  <span className="font-bold text-[#1A1A1A] dark:text-white">
                    FY {plan.financial_year} — Gross ₹
                    {(plan.gross_salary || 0).toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-[#777] dark:text-[#AAA] ml-2">
                    Recommended:{" "}
                    <strong className="uppercase">
                      {plan.recommended_regime} Regime
                    </strong>{" "}
                    (Tax: ₹
                    {(plan.recommended_regime === "new"
                      ? plan.new_regime_tax
                      : plan.old_regime_tax || 0
                    ).toLocaleString("en-IN")}
                    )
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteSavedPlan(plan.id)}
                  className="text-red-600 dark:text-rose-400 hover:underline text-[10px] uppercase font-bold flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <HraCalculatorModal
        isOpen={isHraModalOpen}
        onClose={() => setIsHraModalOpen(false)}
        initialBasicSalary={basicSalary}
        initialHraReceived={hraReceived}
        onApply={(exempt, rent, metro) => {
          setHraExemption(exempt);
          setRentPaid(rent);
          setIsMetro(metro);
          setSaveStatus(
            `HRA Exemption of ₹${exempt.toLocaleString("en-IN")} applied!`,
          );
          setTimeout(() => setSaveStatus(null), 4000);
        }}
      />

      <TaxFilingSummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        result={result}
        userEmail={user?.email || ""}
      />
    </div>
  );
}
