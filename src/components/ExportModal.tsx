import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getTransactions,
  getIncomes,
  getBudgets,
  getTransactionsForMonths,
  getIncomesForMonths,
  getBudgetsForMonths,
  getAllTransactions,
  getAllIncomes,
  getTaxCalculations,
} from "../lib/db";
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
} from "../lib/exportUtils";
import {
  FileText,
  FileSpreadsheet,
  Table,
  Download,
  Calendar,
  X,
  CheckCircle2,
  Layers,
  TrendingUp,
  Percent,
  Receipt,
  FileCheck,
} from "lucide-react";

export type ExportReportType =
  "pl_statement" | "category_summary" | "transaction_ledger" | "tax_filing";
export type PeriodOption =
  | "current_month"
  | "last_3_months"
  | "last_6_months"
  | "financial_year"
  | "all_time";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMonth: string;
}

export function ExportModal({
  isOpen,
  onClose,
  defaultMonth,
}: ExportModalProps) {
  const { user, household } = useAuth();
  const [reportType, setReportType] =
    useState<ExportReportType>("pl_statement");
  const [period, setPeriod] = useState<PeriodOption>("current_month");
  const [customMonth, setCustomMonth] = useState(defaultMonth);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  useEffect(() => {
    setCustomMonth(defaultMonth);
  }, [defaultMonth]);

  if (!isOpen) return null;

  const getMonthsForPeriod = (
    periodChoice: PeriodOption,
    baseMonth: string,
  ): string[] => {
    const [year, month] = baseMonth.split("-").map(Number);
    const months: string[] = [];

    if (periodChoice === "current_month") {
      return [baseMonth];
    } else if (periodChoice === "last_3_months") {
      for (let i = 0; i < 3; i++) {
        const d = new Date(year, month - 1 - i, 1);
        const m = (d.getMonth() + 1).toString().padStart(2, "0");
        months.push(`${d.getFullYear()}-${m}`);
      }
      return months.reverse();
    } else if (periodChoice === "last_6_months") {
      for (let i = 0; i < 6; i++) {
        const d = new Date(year, month - 1 - i, 1);
        const m = (d.getMonth() + 1).toString().padStart(2, "0");
        months.push(`${d.getFullYear()}-${m}`);
      }
      return months.reverse();
    } else if (periodChoice === "financial_year") {
      // Indian Financial Year: April of start year to March of next year
      const fyStartYear = month >= 4 ? year : year - 1;
      for (let m = 4; m <= 12; m++) {
        months.push(`${fyStartYear}-${m.toString().padStart(2, "0")}`);
      }
      for (let m = 1; m <= 3; m++) {
        months.push(`${fyStartYear + 1}-${m.toString().padStart(2, "0")}`);
      }
      return months;
    }
    return [];
  };

  const getPeriodLabel = (): string => {
    if (period === "current_month") {
      const [y, m] = customMonth.split("-").map(Number);
      const d = new Date(y, m - 1, 1);
      return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } else if (period === "last_3_months") {
      return `Last 3 Months (Ending ${customMonth})`;
    } else if (period === "last_6_months") {
      return `Last 6 Months (Ending ${customMonth})`;
    } else if (period === "financial_year") {
      const [year, month] = customMonth.split("-").map(Number);
      const fyStart = month >= 4 ? year : year - 1;
      return `FY ${fyStart}-${(fyStart + 1).toString().slice(2)}`;
    }
    return "All Time";
  };

  const handleExport = async (format: "pdf" | "excel" | "csv") => {
    if (!user) return;
    setIsExporting(true);
    setExportSuccess(null);

    try {
      const periodLabel = getPeriodLabel();
      const months = getMonthsForPeriod(period, customMonth);

      // Fetch relevant datasets
      let transactions: any[] = [];
      let incomes: any[] = [];
      let budgets: any[] = [];

      if (period === "all_time") {
        [transactions, incomes] = await Promise.all([
          getAllTransactions(user.uid),
          getAllIncomes(user.uid),
        ]);
      } else {
        [transactions, incomes, budgets] = await Promise.all([
          getTransactionsForMonths(user.uid, months),
          getIncomesForMonths(user.uid, months),
          getBudgetsForMonths(user.uid, months),
        ]);
      }

      if (reportType === "pl_statement") {
        const plData = {
          periodLabel,
          incomes,
          transactions,
          budgets,
          householdName: household?.name,
          userName: user.email?.split("@")[0],
        };

        if (format === "pdf") exportPLStatementPDF(plData);
        else if (format === "excel") exportPLStatementExcel(plData);
        else if (format === "csv") exportPLStatementCSV(plData);
      } else if (reportType === "category_summary") {
        const items = computeCategorySummaries(transactions, budgets);
        if (format === "pdf")
          exportCategorySummaryPDF(items, periodLabel, household?.name);
        else if (format === "excel")
          exportCategorySummaryExcel(items, periodLabel, household?.name);
        else if (format === "csv") {
          // CSV export of category summary
          const csvHeaders = [
            "Category",
            "Spent (INR)",
            "Budget Limit (INR)",
            "Variance (INR)",
            "% of Total",
            "Transaction Count",
          ];
          const csvRows = items.map((i) => [
            i.category,
            i.spent,
            i.budget,
            i.variance,
            `${i.percentOfTotal}%`,
            i.count,
          ]);
          const csvContent = [
            csvHeaders.join(","),
            ...csvRows.map((r) => r.join(",")),
          ].join("\n");
          const blob = new Blob(["\ufeff" + csvContent], {
            type: "text/csv;charset=utf-8;",
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `Category_Summary_${periodLabel.replace(/\s+/g, "_")}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      } else if (reportType === "transaction_ledger") {
        if (format === "pdf")
          exportLedgerPDF(transactions, periodLabel, household?.name);
        else if (format === "excel")
          exportLedgerExcel(transactions, periodLabel, household?.name);
        else if (format === "csv") exportLedgerCSV(transactions, periodLabel);
      } else if (reportType === "tax_filing") {
        const taxCalcs = await getTaxCalculations(user.uid);
        const [year, month] = customMonth.split("-").map(Number);
        const fyStart = month >= 4 ? year : year - 1;
        const fyStr = `${fyStart}-${(fyStart + 1).toString().slice(2)}`;
        const matchingCalc =
          taxCalcs.find((t) => t.financial_year === fyStr) ||
          taxCalcs[0] ||
          null;

        const taxData = {
          financialYear: fyStr,
          incomes,
          transactions,
          taxCalc: matchingCalc,
          householdName: household?.name,
          userName: user.email?.split("@")[0],
        };

        if (format === "pdf" || format === "excel" || format === "csv") {
          exportTaxPackPDF(taxData);
        }
      }

      setExportSuccess(
        `${reportType.replace(/_/g, " ").toUpperCase()} exported successfully in ${format.toUpperCase()} format!`,
      );
      setTimeout(() => setExportSuccess(null), 4000);
    } catch (error) {
      console.error("Export error:", error);
      alert(
        "Error generating export. Please ensure you have data for the chosen period.",
      );
    } finally {
      setIsExporting(false);
    }
  };

  const reportTypes = [
    {
      id: "pl_statement" as ExportReportType,
      title: "Profit & Loss Statement",
      desc: "Monthly/Quarterly income, itemized payroll deductions, category expenses, and net surplus.",
      icon: TrendingUp,
      badge: "Financial Statement",
    },
    {
      id: "category_summary" as ExportReportType,
      title: "Category & Budget Variance",
      desc: "Comprehensive table of all spend categories, allocated budget, variance, and spending share.",
      icon: Layers,
      badge: "Variance Report",
    },
    {
      id: "transaction_ledger" as ExportReportType,
      title: "Full Transaction Ledger",
      desc: "Granular audit trail with dates, categories, payment methods, notes, and sources for accounting.",
      icon: Receipt,
      badge: "Audit Ledger",
    },
    {
      id: "tax_filing" as ExportReportType,
      title: "Tax Filing Computation Pack",
      desc: "Standardized worksheet with 80C, 80D, HRA, home loan deductions, and Old vs New regime.",
      icon: Percent,
      badge: "CA / ITR Ready",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1] border-2 border-[#1A1A1A] dark:border-[#444] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[10px_10px_0px_#1A1A1A] dark:shadow-[10px_10px_0px_#000] p-5 sm:p-7 relative flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-[#1A1A1A] dark:border-[#383838] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-[#1A1A1A] dark:text-[#F0ECE1]" />
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1A1A1A] dark:text-[#F0ECE1]">
                Export Financial Reports
              </h2>
            </div>
            <p className="text-[10px] uppercase font-mono tracking-widest text-[#666] dark:text-[#A0A0A0] mt-1">
              Download PDF Statements, Multi-Tab Excel Workbooks, or CSV Files
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 border border-[#1A1A1A] dark:border-[#555] hover:bg-gray-100 dark:hover:bg-[#282828] text-[#1A1A1A] dark:text-[#F0ECE1] transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Select Report Type */}
        <div>
          <label className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] block mb-2.5">
            1. Select Report Document
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {reportTypes.map((rt) => {
              const Icon = rt.icon;
              const isSelected = reportType === rt.id;
              return (
                <button
                  key={rt.id}
                  type="button"
                  onClick={() => setReportType(rt.id)}
                  className={`p-3 text-left border transition-all flex flex-col justify-between ${
                    isSelected
                      ? "border-[#1A1A1A] dark:border-white bg-[#FCFAF7] dark:bg-[#242424] shadow-[3px_3px_0px_#1A1A1A] dark:shadow-[3px_3px_0px_#000] ring-1 ring-[#1A1A1A] dark:ring-white"
                      : "border-gray-200 dark:border-[#333] bg-white dark:bg-[#1E1E1E] hover:border-gray-400 dark:hover:border-[#555]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-[#1A1A1A] dark:text-[#F0ECE1]" />
                      <span className="font-serif font-bold text-xs sm:text-sm text-[#1A1A1A] dark:text-[#F0ECE1]">
                        {rt.title}
                      </span>
                    </div>
                    <span className="text-[8px] uppercase font-mono font-bold tracking-wider px-1.5 py-0.5 border border-[#1A1A1A] dark:border-[#555] bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#E0E0E0]">
                      {rt.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#555] dark:text-[#999] leading-relaxed line-clamp-2">
                    {rt.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Select Date Range / Reporting Period */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0]">
              2. Select Reporting Period
            </label>
            <span className="text-[10px] font-mono font-bold text-[#2A4B3A] dark:text-[#76B093]">
              Target: {getPeriodLabel()}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: "current_month" as PeriodOption, label: "This Month" },
              { id: "last_3_months" as PeriodOption, label: "Last 3 Mos" },
              { id: "last_6_months" as PeriodOption, label: "Last 6 Mos" },
              { id: "financial_year" as PeriodOption, label: "Financial Year" },
              { id: "all_time" as PeriodOption, label: "All History" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={`py-2 px-2 text-[10px] uppercase font-mono font-bold tracking-wider border transition-colors ${
                  period === p.id
                    ? "bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] border-[#1A1A1A] dark:border-white"
                    : "bg-white dark:bg-[#1E1E1E] text-[#1A1A1A] dark:text-[#CCC] border-gray-300 dark:border-[#3A3A3A] hover:border-black dark:hover:border-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {period !== "all_time" && (
            <div className="mt-2.5 flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase text-[#666] dark:text-[#999]">
                Reference Month:
              </span>
              <input
                type="month"
                value={customMonth}
                onChange={(e) => setCustomMonth(e.target.value)}
                className="text-xs font-mono border border-[#1A1A1A] dark:border-[#555] px-2 py-1 bg-white dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Step 3: Export Actions */}
        <div className="border-t-2 border-[#1A1A1A] dark:border-[#383838] pt-4 flex flex-col gap-3">
          <label className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0]">
            3. Choose Download Format
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => handleExport("pdf")}
              disabled={isExporting}
              className="border-2 border-[#1A1A1A] dark:border-white bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] py-3 px-4 flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-[3px_3px_0px_#777] dark:shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 touch-manipulation"
            >
              <FileText className="w-4 h-4 text-red-400 dark:text-red-600" />
              <div className="text-left">
                <span className="block text-xs uppercase font-bold tracking-wider">
                  PDF Report
                </span>
                <span className="block text-[8px] opacity-80">
                  Official Formatted Doc
                </span>
              </div>
            </button>

            <button
              onClick={() => handleExport("excel")}
              disabled={isExporting}
              className="border-2 border-[#1A1A1A] dark:border-[#555] bg-white dark:bg-[#1E1E1E] text-[#1A1A1A] dark:text-[#F0ECE1] py-3 px-4 flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-[#282828] transition-colors shadow-[3px_3px_0px_#1A1A1A] dark:shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 touch-manipulation"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <div className="text-left">
                <span className="block text-xs uppercase font-bold tracking-wider">
                  Excel (.XLSX)
                </span>
                <span className="block text-[8px] text-[#666] dark:text-[#AAA]">
                  Multi-Sheet Workbook
                </span>
              </div>
            </button>

            <button
              onClick={() => handleExport("csv")}
              disabled={isExporting}
              className="border-2 border-[#1A1A1A] dark:border-[#555] bg-white dark:bg-[#1E1E1E] text-[#1A1A1A] dark:text-[#F0ECE1] py-3 px-4 flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-[#282828] transition-colors shadow-[3px_3px_0px_#1A1A1A] dark:shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 touch-manipulation"
            >
              <Table className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <div className="text-left">
                <span className="block text-xs uppercase font-bold tracking-wider">
                  CSV Data
                </span>
                <span className="block text-[8px] text-[#666] dark:text-[#AAA]">
                  Universal Spreadsheet
                </span>
              </div>
            </button>
          </div>

          {exportSuccess && (
            <div className="bg-[#F0F5F2] dark:bg-[#1A2E22] border border-[#2A4B3A] dark:border-emerald-500 p-2.5 flex items-center gap-2 text-xs font-mono text-[#2A4B3A] dark:text-emerald-400 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{exportSuccess}</span>
            </div>
          )}

          {isExporting && (
            <p className="text-xs font-mono uppercase tracking-widest text-[#666] dark:text-[#999] text-center animate-pulse">
              Compiling Financial Statement & Downloading...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
