import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { 
  getTransactions, 
  getIncomes, 
  getBudgets, 
  addTransaction,
  getTransactionsForMonths,
  getIncomesForMonths,
  getBudgetsForMonths,
  getAllTransactions,
  getAllIncomes,
  getTaxCalculations
} from "../lib/db";
import { Transaction, IncomeEntry, Budget } from "../types";
import { 
  Download, 
  Upload, 
  BarChart3, 
  PieChart as PieChartIcon, 
  FileText, 
  FileSpreadsheet, 
  Table, 
  CheckCircle2, 
  Layers, 
  TrendingUp, 
  Percent, 
  Receipt,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ShieldCheck
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import {
  exportPLStatementPDF,
  exportPLStatementExcel,
  exportPLStatementCSV,
  exportCategorySummaryPDF,
  exportCategorySummaryExcel,
  computeCategorySummaries,
  exportLedgerPDF,
  exportLedgerExcel,
  exportLedgerCSV,
  exportTaxPackPDF,
  CategorySummaryItem
} from "../lib/exportUtils";

const PIE_COLORS = ['#1A1A1A', '#2A4B3A', '#4A4A4A', '#7A7A7A', '#A3A3A3', '#CCCCCC', '#E5E2DE'];

export type ReportPeriod = "current_month" | "last_3_months" | "last_6_months" | "financial_year" | "all_time";

export function ReportSection({ currentMonth }: { currentMonth: string }) {
  const { user, household } = useAuth();
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Selected Period for Export Hub
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>("current_month");

  // Data States
  const [pieData, setPieData] = useState<{ name: string; value: number }[]>([]);
  const [trendData, setTrendData] = useState<{ month: string; income: number; expense: number; surplus: number }[]>([]);
  const [currentTransactions, setCurrentTransactions] = useState<Transaction[]>([]);
  const [currentIncomes, setCurrentIncomes] = useState<IncomeEntry[]>([]);
  const [currentBudgets, setCurrentBudgets] = useState<Budget[]>([]);

  // CSV Import States
  const [importQueue, setImportQueue] = useState<Partial<Transaction>[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const getLast6Months = (currentYYYYMM: string) => {
    const [yyyy, mm] = currentYYYYMM.split('-').map(Number);
    const result = [];
    for (let i = 0; i < 6; i++) {
       const d = new Date(yyyy, mm - 1 - i, 1);
       const mStr = (d.getMonth() + 1).toString().padStart(2, '0');
       result.push(`${d.getFullYear()}-${mStr}`);
    }
    return result.reverse();
  };

  const getPeriodMonths = (periodChoice: ReportPeriod): string[] => {
    const [year, month] = currentMonth.split("-").map(Number);
    const months: string[] = [];

    if (periodChoice === "current_month") {
      return [currentMonth];
    } else if (periodChoice === "last_3_months") {
      for (let i = 0; i < 3; i++) {
        const d = new Date(year, month - 1 - i, 1);
        const m = (d.getMonth() + 1).toString().padStart(2, '0');
        months.push(`${d.getFullYear()}-${m}`);
      }
      return months.reverse();
    } else if (periodChoice === "last_6_months") {
      return getLast6Months(currentMonth);
    } else if (periodChoice === "financial_year") {
      const fyStartYear = month >= 4 ? year : year - 1;
      for (let m = 4; m <= 12; m++) {
        months.push(`${fyStartYear}-${m.toString().padStart(2, '0')}`);
      }
      for (let m = 1; m <= 3; m++) {
        months.push(`${fyStartYear + 1}-${m.toString().padStart(2, '0')}`);
      }
      return months;
    }
    return [];
  };

  const getPeriodDisplayLabel = (periodChoice: ReportPeriod): string => {
    if (periodChoice === "current_month") {
      const [y, m] = currentMonth.split("-").map(Number);
      const d = new Date(y, m - 1, 1);
      return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } else if (periodChoice === "last_3_months") {
      return `Last 3 Months (${currentMonth})`;
    } else if (periodChoice === "last_6_months") {
      return `Last 6 Months (${currentMonth})`;
    } else if (periodChoice === "financial_year") {
      const [year, month] = currentMonth.split("-").map(Number);
      const fyStart = month >= 4 ? year : year - 1;
      return `FY ${fyStart}-${(fyStart + 1).toString().slice(2)}`;
    }
    return "All Time Records";
  };

  const fetchData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      const months = getLast6Months(currentMonth);
      
      // Fetch 6-Month Trend Data
      const trendPromises = months.map(async (m) => {
        const txs = await getTransactions(user.uid, m);
        const incs = await getIncomes(user.uid, m);
        
        const expense = (txs || []).reduce((sum, t) => sum + t.amount, 0);
        const income = (incs || []).reduce((sum, i) => sum + (i.net_credited || 0), 0);
        const surplus = income - expense;
        
        return { month: m, income, expense, surplus, txs: txs || [], incs: incs || [] };
      });

      const trendResults = await Promise.all(trendPromises);
      setTrendData(trendResults.map(r => ({ 
        month: r.month, 
        income: r.income, 
        expense: r.expense, 
        surplus: r.surplus 
      })));

      // Extract current month for pie chart & local view
      const currentMonthData = trendResults.find(r => r.month === currentMonth);
      if (currentMonthData) {
        setCurrentTransactions(currentMonthData.txs);
        setCurrentIncomes(currentMonthData.incs);
        
        const categoryMap = new Map<string, number>();
        currentMonthData.txs.forEach(t => {
          categoryMap.set(t.category_id, (categoryMap.get(t.category_id) || 0) + t.amount);
        });
        
        const pie = Array.from(categoryMap.entries())
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);
          
        setPieData(pie);
      }

      // Fetch current budgets
      const budgets = await getBudgets(user.uid, currentMonth);
      setCurrentBudgets(budgets);

    } catch (e) {
      console.warn("Notice loading reports:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, currentMonth]);

  // Export Action Handlers
  const handleExportPL = async (format: "pdf" | "excel" | "csv") => {
    if (!user) return;
    setExportLoading(`pl_${format}`);
    try {
      const periodLabel = getPeriodDisplayLabel(selectedPeriod);
      const months = getPeriodMonths(selectedPeriod);
      
      let txs: Transaction[] = [];
      let incs: IncomeEntry[] = [];
      let bdgts: Budget[] = [];

      if (selectedPeriod === "all_time") {
        [txs, incs] = await Promise.all([
          getAllTransactions(user.uid),
          getAllIncomes(user.uid)
        ]);
      } else {
        [txs, incs, bdgts] = await Promise.all([
          getTransactionsForMonths(user.uid, months),
          getIncomesForMonths(user.uid, months),
          getBudgetsForMonths(user.uid, months)
        ]);
      }

      const payload = {
        periodLabel,
        incomes: incs,
        transactions: txs,
        budgets: bdgts,
        householdName: household?.name,
        userName: user.email?.split("@")[0]
      };

      if (format === "pdf") exportPLStatementPDF(payload);
      else if (format === "excel") exportPLStatementExcel(payload);
      else if (format === "csv") exportPLStatementCSV(payload);

      setExportNotice(`Profit & Loss Statement (${format.toUpperCase()}) exported for ${periodLabel}`);
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err) {
      console.error(err);
      alert("Failed to export Profit & Loss statement.");
    } finally {
      setExportLoading(null);
    }
  };

  const handleExportCategorySummary = async (format: "pdf" | "excel" | "csv") => {
    if (!user) return;
    setExportLoading(`cat_${format}`);
    try {
      const periodLabel = getPeriodDisplayLabel(selectedPeriod);
      const months = getPeriodMonths(selectedPeriod);
      
      let txs: Transaction[] = [];
      let bdgts: Budget[] = [];

      if (selectedPeriod === "all_time") {
        txs = await getAllTransactions(user.uid);
      } else {
        [txs, bdgts] = await Promise.all([
          getTransactionsForMonths(user.uid, months),
          getBudgetsForMonths(user.uid, months)
        ]);
      }

      const items = computeCategorySummaries(txs, bdgts);

      if (format === "pdf") exportCategorySummaryPDF(items, periodLabel, household?.name);
      else if (format === "excel") exportCategorySummaryExcel(items, periodLabel, household?.name);
      else if (format === "csv") {
        const headers = ["Category", "Spent (INR)", "Budget (INR)", "Variance (INR)", "% Share", "Transactions"];
        const rows = items.map(i => [i.category, i.spent, i.budget, i.variance, `${i.percentOfTotal}%`, i.count]);
        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Category_Summary_${periodLabel.replace(/\s+/g, "_")}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      setExportNotice(`Category Summary (${format.toUpperCase()}) exported successfully!`);
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err) {
      console.error(err);
      alert("Failed to export category summary.");
    } finally {
      setExportLoading(null);
    }
  };

  const handleExportLedger = async (format: "pdf" | "excel" | "csv") => {
    if (!user) return;
    setExportLoading(`ledger_${format}`);
    try {
      const periodLabel = getPeriodDisplayLabel(selectedPeriod);
      const months = getPeriodMonths(selectedPeriod);
      
      let txs: Transaction[] = [];
      if (selectedPeriod === "all_time") {
        txs = await getAllTransactions(user.uid);
      } else {
        txs = await getTransactionsForMonths(user.uid, months);
      }

      if (format === "pdf") exportLedgerPDF(txs, periodLabel, household?.name);
      else if (format === "excel") exportLedgerExcel(txs, periodLabel, household?.name);
      else if (format === "csv") exportLedgerCSV(txs, periodLabel);

      setExportNotice(`Transaction Ledger (${format.toUpperCase()}) exported with ${txs.length} records!`);
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err) {
      console.error(err);
      alert("Failed to export transaction ledger.");
    } finally {
      setExportLoading(null);
    }
  };

  const handleExportTaxPack = async () => {
    if (!user) return;
    setExportLoading("tax_pdf");
    try {
      const [year, month] = currentMonth.split("-").map(Number);
      const fyStart = month >= 4 ? year : year - 1;
      const fyStr = `${fyStart}-${(fyStart + 1).toString().slice(2)}`;
      
      // Fetch all months of the FY
      const fyMonths: string[] = [];
      for (let m = 4; m <= 12; m++) fyMonths.push(`${fyStart}-${m.toString().padStart(2, '0')}`);
      for (let m = 1; m <= 3; m++) fyMonths.push(`${fyStart + 1}-${m.toString().padStart(2, '0')}`);

      const [txs, incs, taxCalcs] = await Promise.all([
        getTransactionsForMonths(user.uid, fyMonths),
        getIncomesForMonths(user.uid, fyMonths),
        getTaxCalculations(user.uid)
      ]);

      const matchingCalc = taxCalcs.find(t => t.financial_year === fyStr) || taxCalcs[0] || null;

      exportTaxPackPDF({
        financialYear: fyStr,
        incomes: incs,
        transactions: txs,
        taxCalc: matchingCalc,
        householdName: household?.name,
        userName: user.email?.split("@")[0]
      });

      setExportNotice(`Tax Filing Computation Pack (PDF) generated for FY ${fyStr}`);
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err) {
      console.error(err);
      alert("Failed to export Tax Filing Pack.");
    } finally {
      setExportLoading(null);
    }
  };

  // CSV File Importer
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      
      const queue: Partial<Transaction>[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
        if (cols.length >= 3) {
          queue.push({
            date: cols[0] || `${currentMonth}-01`,
            category_id: cols[1] || 'Miscellaneous',
            amount: Number(cols[2]) || 0,
            payment_mode: (cols[3] as any) || 'UPI',
            note: cols[4] || '',
            source: 'csv_import'
          });
        }
      }
      setImportQueue(queue);
    };
    reader.readAsText(file);
  };

  const processImportQueue = async () => {
    if (!user || importQueue.length === 0) return;
    setIsImporting(true);
    
    for (const item of importQueue) {
      await addTransaction({
        user_id: user.uid,
        category_id: item.category_id!,
        amount: item.amount!,
        date: item.date!,
        note: item.note || "",
        payment_mode: item.payment_mode as any || "UPI",
        source: "csv_import"
      });
    }
    
    setImportQueue([]);
    setIsImporting(false);
    fetchData();
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      
      {/* EXPORT HUB COMMAND CENTER */}
      <div className="bg-white dark:bg-[#1A1A1A] border-2 border-[#1A1A1A] dark:border-[#383838] p-5 sm:p-7 shadow-[6px_6px_0px_#1A1A1A] sm:shadow-[8px_8px_0px_#1A1A1A] dark:shadow-[8px_8px_0px_#000] flex flex-col gap-5 transition-colors">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-[#1A1A1A] dark:border-[#383838] pb-4 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-[#1A1A1A] dark:text-[#F0ECE1]" />
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1A1A1A] dark:text-[#F0ECE1]">
                Financial Statement & Export Center
              </h2>
            </div>
            <p className="text-[10px] uppercase font-mono tracking-widest text-[#666] dark:text-[#A0A0A0] mt-1">
              Export Official PDF Statements, Multi-Tab Excel Workbooks, and CSV Ledgers
            </p>
          </div>

          {/* Period Selector Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#F5F2EB] dark:bg-[#262626] p-1 border border-[#1A1A1A] dark:border-[#444]">
            {[
              { id: "current_month" as ReportPeriod, label: "Month" },
              { id: "last_3_months" as ReportPeriod, label: "Quarter (3M)" },
              { id: "last_6_months" as ReportPeriod, label: "Half-Year (6M)" },
              { id: "financial_year" as ReportPeriod, label: "Financial Year" },
              { id: "all_time" as ReportPeriod, label: "All Records" },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPeriod(p.id)}
                className={`px-2.5 py-1 text-[9px] sm:text-[10px] uppercase font-mono font-bold tracking-wider transition-colors ${
                  selectedPeriod === p.id 
                    ? "bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A]" 
                    : "text-[#1A1A1A] dark:text-[#CCC] hover:bg-white dark:hover:bg-[#333]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {exportNotice && (
          <div className="bg-[#F0F5F2] dark:bg-[#1A2E22] border border-[#2A4B3A] dark:border-emerald-500 p-3 flex items-center gap-2 text-xs font-mono text-[#2A4B3A] dark:text-emerald-400 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-bold">{exportNotice}</span>
          </div>
        )}

        {/* 4 Report Generator Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Profit & Loss Statement */}
          <div className="border border-[#1A1A1A] dark:border-[#383838] bg-[#FCFAF7] dark:bg-[#202020] p-4 flex flex-col justify-between hover:shadow-[3px_3px_0px_#1A1A1A] dark:hover:shadow-[3px_3px_0px_#000] transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#2A4B3A] dark:text-[#76B093]" />
                  <h3 className="font-serif font-bold text-sm text-[#1A1A1A] dark:text-[#F0ECE1]">Profit & Loss</h3>
                </div>
                <span className="text-[8px] uppercase font-mono font-bold px-1.5 py-0.5 border border-[#1A1A1A] dark:border-[#555] bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#E0E0E0]">
                  P&L
                </span>
              </div>
              <p className="text-[10px] text-[#555] dark:text-[#A0A0A0] leading-relaxed mb-4">
                Total gross revenues, payroll deductions (EPF, PT, TDS), operating expenses, and net surplus.
              </p>
            </div>
            <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-300 dark:border-[#333]">
              <button
                onClick={() => handleExportPL("pdf")}
                disabled={!!exportLoading}
                className="w-full bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] py-1.5 px-2.5 text-[9px] uppercase font-mono font-bold tracking-wider flex items-center justify-center gap-1.5 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <FileText className="w-3 h-3 text-red-300 dark:text-red-600" />
                <span>{exportLoading === "pl_pdf" ? "Exporting..." : "Download PDF"}</span>
              </button>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleExportPL("excel")}
                  disabled={!!exportLoading}
                  className="bg-white dark:bg-[#282828] border border-[#1A1A1A] dark:border-[#444] text-[#1A1A1A] dark:text-[#E0E0E0] py-1 px-2 text-[9px] uppercase font-mono font-bold tracking-wider flex items-center justify-center gap-1 hover:bg-gray-100 dark:hover:bg-[#333] transition-colors disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={() => handleExportPL("csv")}
                  disabled={!!exportLoading}
                  className="bg-white dark:bg-[#282828] border border-[#1A1A1A] dark:border-[#444] text-[#1A1A1A] dark:text-[#E0E0E0] py-1 px-2 text-[9px] uppercase font-mono font-bold tracking-wider flex items-center justify-center gap-1 hover:bg-gray-100 dark:hover:bg-[#333] transition-colors disabled:opacity-50"
                >
                  <Table className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  <span>CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Category & Budget Variance */}
          <div className="border border-[#1A1A1A] dark:border-[#383838] bg-[#FCFAF7] dark:bg-[#202020] p-4 flex flex-col justify-between hover:shadow-[3px_3px_0px_#1A1A1A] dark:hover:shadow-[3px_3px_0px_#000] transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#1A1A1A] dark:text-[#F0ECE1]" />
                  <h3 className="font-serif font-bold text-sm text-[#1A1A1A] dark:text-[#F0ECE1]">Category Summary</h3>
                </div>
                <span className="text-[8px] uppercase font-mono font-bold px-1.5 py-0.5 border border-[#1A1A1A] dark:border-[#555] bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#E0E0E0]">
                  Variance
                </span>
              </div>
              <p className="text-[10px] text-[#555] dark:text-[#A0A0A0] leading-relaxed mb-4">
                Detailed spend per category, budget limits, under/over variance, and % share of expenditures.
              </p>
            </div>
            <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-300 dark:border-[#333]">
              <button
                onClick={() => handleExportCategorySummary("pdf")}
                disabled={!!exportLoading}
                className="w-full bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] py-1.5 px-2.5 text-[9px] uppercase font-mono font-bold tracking-wider flex items-center justify-center gap-1.5 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <FileText className="w-3 h-3 text-red-300 dark:text-red-600" />
                <span>{exportLoading === "cat_pdf" ? "Exporting..." : "Download PDF"}</span>
              </button>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleExportCategorySummary("excel")}
                  disabled={!!exportLoading}
                  className="bg-white dark:bg-[#282828] border border-[#1A1A1A] dark:border-[#444] text-[#1A1A1A] dark:text-[#E0E0E0] py-1 px-2 text-[9px] uppercase font-mono font-bold tracking-wider flex items-center justify-center gap-1 hover:bg-gray-100 dark:hover:bg-[#333] transition-colors disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={() => handleExportCategorySummary("csv")}
                  disabled={!!exportLoading}
                  className="bg-white dark:bg-[#282828] border border-[#1A1A1A] dark:border-[#444] text-[#1A1A1A] dark:text-[#E0E0E0] py-1 px-2 text-[9px] uppercase font-mono font-bold tracking-wider flex items-center justify-center gap-1 hover:bg-gray-100 dark:hover:bg-[#333] transition-colors disabled:opacity-50"
                >
                  <Table className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  <span>CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 3: Transaction Ledger */}
          <div className="border border-[#1A1A1A] dark:border-[#383838] bg-[#FCFAF7] dark:bg-[#202020] p-4 flex flex-col justify-between hover:shadow-[3px_3px_0px_#1A1A1A] dark:hover:shadow-[3px_3px_0px_#000] transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-[#1A1A1A] dark:text-[#F0ECE1]" />
                  <h3 className="font-serif font-bold text-sm text-[#1A1A1A] dark:text-[#F0ECE1]">Transaction Ledger</h3>
                </div>
                <span className="text-[8px] uppercase font-mono font-bold px-1.5 py-0.5 border border-[#1A1A1A] dark:border-[#555] bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#E0E0E0]">
                  Audit
                </span>
              </div>
              <p className="text-[10px] text-[#555] dark:text-[#A0A0A0] leading-relaxed mb-4">
                Granular itemized log with dates, modes (UPI/Card), merchants, receipts, and sources.
              </p>
            </div>
            <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-300 dark:border-[#333]">
              <button
                onClick={() => handleExportLedger("pdf")}
                disabled={!!exportLoading}
                className="w-full bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] py-1.5 px-2.5 text-[9px] uppercase font-mono font-bold tracking-wider flex items-center justify-center gap-1.5 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <FileText className="w-3 h-3 text-red-300 dark:text-red-600" />
                <span>{exportLoading === "ledger_pdf" ? "Exporting..." : "Download PDF"}</span>
              </button>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleExportLedger("excel")}
                  disabled={!!exportLoading}
                  className="bg-white dark:bg-[#282828] border border-[#1A1A1A] dark:border-[#444] text-[#1A1A1A] dark:text-[#E0E0E0] py-1 px-2 text-[9px] uppercase font-mono font-bold tracking-wider flex items-center justify-center gap-1 hover:bg-gray-100 dark:hover:bg-[#333] transition-colors disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={() => handleExportLedger("csv")}
                  disabled={!!exportLoading}
                  className="bg-white dark:bg-[#282828] border border-[#1A1A1A] dark:border-[#444] text-[#1A1A1A] dark:text-[#E0E0E0] py-1 px-2 text-[9px] uppercase font-mono font-bold tracking-wider flex items-center justify-center gap-1 hover:bg-gray-100 dark:hover:bg-[#333] transition-colors disabled:opacity-50"
                >
                  <Table className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  <span>CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 4: Tax Computation Pack */}
          <div className="border border-[#1A1A1A] dark:border-[#383838] bg-[#FCFAF7] dark:bg-[#202020] p-4 flex flex-col justify-between hover:shadow-[3px_3px_0px_#1A1A1A] dark:hover:shadow-[3px_3px_0px_#000] transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-[#2A4B3A] dark:text-[#76B093]" />
                  <h3 className="font-serif font-bold text-sm text-[#1A1A1A] dark:text-[#F0ECE1]">Tax Filing Pack</h3>
                </div>
                <span className="text-[8px] uppercase font-mono font-bold px-1.5 py-0.5 border border-[#2A4B3A] dark:border-emerald-500 text-[#2A4B3A] dark:text-emerald-400 bg-white dark:bg-[#1A1A1A]">
                  CA Ready
                </span>
              </div>
              <p className="text-[10px] text-[#555] dark:text-[#A0A0A0] leading-relaxed mb-4">
                Standard deduction, Section 80C/80D, HRA exemption, home loan interest, and Old vs New regime.
              </p>
            </div>
            <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-300 dark:border-[#333]">
              <button
                onClick={handleExportTaxPack}
                disabled={!!exportLoading}
                className="w-full bg-[#2A4B3A] dark:bg-emerald-600 text-white py-1.5 px-2.5 text-[9px] uppercase font-mono font-bold tracking-wider flex items-center justify-center gap-1.5 hover:opacity-90 transition-colors disabled:opacity-50"
              >
                <FileText className="w-3 h-3 text-emerald-200" />
                <span>{exportLoading === "tax_pdf" ? "Compiling..." : "Download Tax PDF"}</span>
              </button>
              <div className="text-[9px] font-mono text-center text-[#666] dark:text-[#AAA] py-1 bg-white dark:bg-[#282828] border border-gray-200 dark:border-[#444]">
                <span>Auto-calculates FY deductions</span>
              </div>
            </div>
          </div>

        </div>

        {/* CSV Import Strip */}
        <div className="border-t border-[#1A1A1A] dark:border-[#383838] pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#1A1A1A] dark:text-[#F0ECE1]" />
            <span className="text-xs font-mono font-bold text-[#1A1A1A] dark:text-[#F0ECE1]">Need to batch import bank statement transactions?</span>
          </div>
          <div className="relative overflow-hidden w-full sm:w-auto">
            <button className="w-full bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] px-4 py-2 text-[10px] uppercase font-bold tracking-widest hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              <span>Import CSV File</span>
            </button>
            <input 
              type="file" 
              accept=".csv"
              onChange={handleFileUpload}
              className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

      </div>

      {/* Import Queue Preview */}
      {importQueue.length > 0 && (
        <div className="bg-[#F0F5F2] dark:bg-[#182B20] border border-[#2A4B3A] dark:border-emerald-600 p-4 sm:p-6 shadow-[4px_4px_0px_#2A4B3A] sm:shadow-[8px_8px_0px_#2A4B3A] dark:shadow-[8px_8px_0px_#000]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b border-[#2A4B3A] dark:border-emerald-600 pb-2 gap-2">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#2A4B3A] dark:text-emerald-400">
              Import Queue ({importQueue.length} items ready)
            </h3>
            <div className="flex gap-3 self-end sm:self-auto">
              <button 
                onClick={() => setImportQueue([])} 
                className="text-[10px] font-bold uppercase tracking-widest text-red-700 dark:text-red-400 hover:underline touch-manipulation py-1"
              >
                Cancel
              </button>
              <button 
                onClick={processImportQueue} 
                disabled={isImporting} 
                className="bg-[#2A4B3A] dark:bg-emerald-600 text-white px-3 sm:px-4 py-1 text-[10px] font-bold uppercase tracking-widest hover:opacity-90 touch-manipulation"
              >
                {isImporting ? "Importing..." : "Confirm Import"}
              </button>
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto overflow-x-auto border border-[#2A4B3A] dark:border-emerald-600">
            <table className="w-full text-left border-collapse text-xs font-mono min-w-[300px] bg-white dark:bg-[#1E1E1E] text-[#1A1A1A] dark:text-[#F0ECE1]">
              <thead>
                <tr className="border-b border-[#2A4B3A] dark:border-emerald-600 text-[9px] uppercase bg-[#2A4B3A] dark:bg-emerald-700 text-white sticky top-0">
                  <th className="py-1.5 px-2">Date</th>
                  <th className="py-1.5 px-2">Category</th>
                  <th className="py-1.5 px-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {importQueue.slice(0, 50).map((row, idx) => (
                  <tr key={idx} className="border-b border-dotted border-gray-300 dark:border-[#333] hover:bg-[#F0F5F2] dark:hover:bg-[#252525]">
                    <td className="py-1 px-2">{row.date}</td>
                    <td className="py-1 px-2">{row.category_id}</td>
                    <td className="py-1 px-2 text-right font-bold">₹{row.amount?.toLocaleString()}</td>
                  </tr>
                ))}
                {importQueue.length > 50 && (
                  <tr>
                    <td colSpan={3} className="py-2 text-center text-[10px] italic text-[#666] dark:text-[#999]">
                      ... and {importQueue.length - 50} more items
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-xs font-mono uppercase tracking-widest text-[#666] dark:text-[#999] py-4">Loading Analytics & Visual Charts...</p>
      ) : (
        <div className="grid grid-cols-12 gap-6 sm:gap-8">
          
          {/* Trend Chart (6 Months) */}
          <div className="col-span-12 lg:col-span-8 bg-white dark:bg-[#1A1A1A] border border-[#1A1A1A] dark:border-[#383838] p-4 sm:p-6 md:p-8 shadow-[4px_4px_0px_#1A1A1A] sm:shadow-[8px_8px_0px_#1A1A1A] dark:shadow-[8px_8px_0px_#000]">
            <div className="flex items-center justify-between mb-4 sm:mb-6 border-b-2 border-[#1A1A1A] dark:border-[#383838] pb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#1A1A1A] dark:text-[#F0ECE1]" />
                <h2 className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-[#1A1A1A] dark:text-[#F0ECE1]">
                  6-Month Cashflow & Trend
                </h2>
              </div>
              <span className="text-[9px] uppercase font-mono font-bold text-[#666] dark:text-[#A0A0A0]">
                Income vs Expense
              </span>
            </div>
            <div className="h-60 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888833" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#888888', fontFamily: 'monospace' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#888888', fontFamily: 'monospace' }} />
                  <Tooltip 
                    cursor={{ fill: '#88888815' }} 
                    contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #444', color: '#fff', fontSize: '11px', fontFamily: 'monospace', borderRadius: '0px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend iconType="square" wrapperStyle={{ fontSize: '9px', fontFamily: 'monospace', textTransform: 'uppercase', marginTop: '10px' }} />
                  <Bar dataKey="income" name="Income" fill="#2A4B3A" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#7A7A7A" radius={[0, 0, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart (Current Month Expense Split) */}
          <div className="col-span-12 lg:col-span-4 bg-white dark:bg-[#1A1A1A] border border-[#1A1A1A] dark:border-[#383838] p-4 sm:p-6 md:p-8 shadow-[4px_4px_0px_#1A1A1A] sm:shadow-[8px_8px_0px_#1A1A1A] dark:shadow-[8px_8px_0px_#000] flex flex-col">
            <div className="flex items-center gap-2 mb-4 sm:mb-6 border-b-2 border-[#1A1A1A] dark:border-[#383838] pb-2">
              <PieChartIcon className="w-5 h-5 text-[#1A1A1A] dark:text-[#F0ECE1]" />
              <h2 className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-[#1A1A1A] dark:text-[#F0ECE1]">
                Expense Split
              </h2>
            </div>
            {pieData.length === 0 ? (
              <p className="text-xs font-mono uppercase tracking-widest text-[#666] dark:text-[#999] flex-grow flex items-center justify-center py-12">
                No expense data for this month
              </p>
            ) : (
              <div className="h-52 sm:h-60 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #444', color: '#fff', fontSize: '11px', fontFamily: 'monospace', borderRadius: '0px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-[#666] dark:text-[#A0A0A0]">Total</span>
                  <span className="font-serif italic font-bold text-sm sm:text-base text-[#1A1A1A] dark:text-[#F0ECE1]">
                    ₹{trendData.find(t => t.month === currentMonth)?.expense.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
            
            {pieData.length > 0 && (
              <div className="mt-3 max-h-36 overflow-y-auto border-t border-dotted border-gray-300 dark:border-[#383838] pt-2">
                <table className="w-full text-xs font-mono text-[#1A1A1A] dark:text-[#F0ECE1]">
                  <tbody>
                    {pieData.map((entry, index) => (
                      <tr key={index} className="border-b border-dotted border-gray-200 dark:border-[#333]">
                        <td className="py-1 flex items-center gap-2">
                          <div className="w-2.5 h-2.5 shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></div>
                          <span className="truncate max-w-[120px] sm:max-w-[140px] uppercase text-[10px]">{entry.name}</span>
                        </td>
                        <td className="py-1 text-right font-bold text-[11px]">₹{entry.value.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
