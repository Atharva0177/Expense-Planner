import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { OverviewSection } from "../components/OverviewSection";
import { IncomeSection } from "../components/IncomeSection";
import { ExpenseSection } from "../components/ExpenseSection";
import { BudgetSection } from "../components/BudgetSection";
import { RecurringSection } from "../components/RecurringSection";
import { LoanSection } from "../components/LoanSection";
import { GoalSection } from "../components/GoalSection";
import { TaxSection } from "../components/TaxSection";
import { ReportSection } from "../components/ReportSection";
import { HouseholdSettings } from "../components/HouseholdSettings";
import { InvestmentSection } from "../components/InvestmentSection";
import { 
  LayoutDashboard, 
  Receipt, 
  Wallet, 
  PieChart, 
  Repeat, 
  Building, 
  PiggyBank, 
  Percent, 
  BarChart3, 
  Users, 
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Calendar
} from "lucide-react";

type TabKey = "overview" | "household" | "investments" | "expense" | "income" | "budgets" | "recurring" | "loans" | "goals" | "taxes" | "reports";

export function Dashboard() {
  const { user, household, householdMember } = useAuth();
  const isDependent = householdMember?.role === "dependent";
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  // Format current month to YYYY-MM
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${d.getFullYear()}-${m}`;
  });

  const stepMonth = (delta: number) => {
    const [year, month] = currentMonth.split("-").map(Number);
    const d = new Date(year, month - 1 + delta, 1);
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    setCurrentMonth(`${d.getFullYear()}-${m}`);
  };

  const formatMonthTitle = (yyyyMm: string) => {
    try {
      const [year, month] = yyyyMm.split("-").map(Number);
      const d = new Date(year, month - 1, 1);
      return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } catch {
      return yyyyMm;
    }
  };

  const tabs: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }>; hideIfDependent?: boolean }[] = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "household", label: "Family", icon: Users },
    { key: "investments", label: "Investments", icon: TrendingUp, hideIfDependent: true },
    { key: "expense", label: "Expenses", icon: Receipt },
    { key: "income", label: "Income", icon: Wallet, hideIfDependent: true },
    { key: "budgets", label: "Budgets", icon: PieChart },
    { key: "recurring", label: "Recurring", icon: Repeat },
    { key: "loans", label: "Loans & EMI", icon: Building },
    { key: "goals", label: "Goals", icon: PiggyBank },
    { key: "taxes", label: "Taxes", icon: Percent, hideIfDependent: true },
    { key: "reports", label: "Reports", icon: BarChart3 }
  ];

  const visibleTabs = tabs.filter(t => !isDependent || !t.hideIfDependent);

  return (
    <div className="min-h-screen bg-[#FCFAF7] text-[#1A1A1A] flex flex-col font-sans p-3 sm:p-6 md:p-10 border-0 sm:border-[6px] md:border-[12px] border-white shadow-inner">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-2 border-[#1A1A1A] pb-4 mb-4 sm:mb-6 md:mb-8 shrink-0 gap-4 sm:gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-serif italic font-light tracking-tight">ExpensePlanner</h1>
            {householdMember && (
              <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 border border-[#1A1A1A] bg-white self-center">
                {householdMember.role}
              </span>
            )}
          </div>
          <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] sm:tracking-[0.3em] font-bold mt-1 text-[#555]">
            {household?.name ? `${household.name} • ` : ""}Personal & Family Finance
          </p>
        </div>

        {/* User Info & Month Navigator Controls */}
        <div className="w-full md:w-auto flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end justify-between gap-3 sm:gap-4">
          <div className="flex items-center justify-between w-full sm:w-auto gap-3">
            <p className="text-[11px] sm:text-xs font-mono font-medium truncate max-w-[200px] sm:max-w-[260px] text-[#333]">
              {user?.email}
            </p>
            <button 
              onClick={() => signOut(auth)}
              className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest hover:opacity-70 transition-opacity border-b border-[#1A1A1A] pb-0.5 active:scale-95 touch-manipulation"
              title="Sign Out"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign out</span>
            </button>
          </div>

          {/* Month Stepper & Picker */}
          <div className="flex items-center justify-between sm:justify-end gap-1.5 w-full sm:w-auto bg-white border border-[#1A1A1A] p-1 shadow-[2px_2px_0px_#1A1A1A]">
            <button 
              onClick={() => stepMonth(-1)}
              className="p-1.5 hover:bg-[#FCFAF7] border border-transparent hover:border-[#1A1A1A] active:bg-gray-200 transition-colors touch-manipulation"
              title="Previous Month"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 px-2">
              <Calendar className="w-3.5 h-3.5 opacity-60 hidden xs:inline" />
              <span className="text-xs font-serif italic font-bold min-w-[72px] text-center">
                {formatMonthTitle(currentMonth)}
              </span>
              <input 
                type="month" 
                value={currentMonth}
                onChange={e => setCurrentMonth(e.target.value)}
                className="text-xs font-mono border-0 bg-transparent outline-none cursor-pointer w-5 overflow-hidden text-transparent focus:text-black opacity-40 hover:opacity-100"
                title="Select month"
              />
            </div>

            <button 
              onClick={() => stepMonth(1)}
              className="p-1.5 hover:bg-[#FCFAF7] border border-transparent hover:border-[#1A1A1A] active:bg-gray-200 transition-colors touch-manipulation"
              title="Next Month"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>
      
      <main className="flex-grow flex flex-col">
        {/* Mobile Quick Dropdown Selector for small screens */}
        <div className="block sm:hidden mb-4">
          <label className="block text-[9px] uppercase font-bold tracking-widest text-[#666] mb-1">
            Section
          </label>
          <div className="relative">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as TabKey)}
              className="w-full bg-white border-2 border-[#1A1A1A] py-2.5 px-3 font-serif italic text-base font-bold shadow-[3px_3px_0px_#1A1A1A] outline-none appearance-none cursor-pointer"
            >
              {visibleTabs.map(t => (
                <option key={t.key} value={t.key} className="font-sans not-italic text-sm">
                  {t.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#1A1A1A]">
              ▼
            </div>
          </div>
        </div>

        {/* Scrollable Navigation Tabs Ribbon */}
        <div className="flex gap-2 sm:gap-3 mb-6 md:mb-8 shrink-0 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-none touch-pan-x">
          {visibleTabs.map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 text-[10px] sm:text-[11px] uppercase font-bold tracking-wider transition-all min-h-[38px] active:scale-95 touch-manipulation ${
                  isActive
                    ? "bg-[#1A1A1A] text-white shadow-[3px_3px_0px_#888]"
                    : "bg-white border border-[#1A1A1A] text-[#1A1A1A] hover:bg-gray-100 shadow-[2px_2px_0px_#1A1A1A]"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Section View Container */}
        <section className="flex-grow pb-8">
          {activeTab === "overview" && <OverviewSection currentMonth={currentMonth} />}
          {activeTab === "household" && <HouseholdSettings />}
          {activeTab === "investments" && <InvestmentSection />}
          {activeTab === "expense" && <ExpenseSection currentMonth={currentMonth} />}
          {activeTab === "income" && <IncomeSection currentMonth={currentMonth} />}
          {activeTab === "budgets" && <BudgetSection currentMonth={currentMonth} />}
          {activeTab === "recurring" && <RecurringSection />}
          {activeTab === "loans" && <LoanSection />}
          {activeTab === "goals" && <GoalSection />}
          {activeTab === "taxes" && <TaxSection currentMonth={currentMonth} />}
          {activeTab === "reports" && <ReportSection currentMonth={currentMonth} />}
        </section>
      </main>

      <footer className="mt-auto pt-4 border-t border-[#1A1A1A] flex flex-col sm:flex-row justify-between items-start sm:items-center opacity-60 shrink-0 gap-2 text-[9px]">
        <p className="uppercase tracking-widest">Manual Entry Mode • Local Database Security</p>
        <p className="font-mono">FY {new Date().getFullYear()}-{Number(new Date().getFullYear().toString().slice(2))+1}</p>
      </footer>
    </div>
  );
}
