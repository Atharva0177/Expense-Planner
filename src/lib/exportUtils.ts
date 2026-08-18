import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Transaction, IncomeEntry, Budget, TaxCalculation } from "../types";

export interface PLStatementData {
  periodLabel: string;
  incomes: IncomeEntry[];
  transactions: Transaction[];
  budgets?: Budget[];
  householdName?: string;
  userName?: string;
}

export interface CategorySummaryItem {
  category: string;
  spent: number;
  budget: number;
  variance: number; // positive = under budget, negative = over budget
  percentOfTotal: number;
  count: number;
}

export interface TaxReportData {
  financialYear: string;
  incomes: IncomeEntry[];
  transactions: Transaction[];
  taxCalc?: TaxCalculation | null;
  householdName?: string;
  userName?: string;
}

const formatINR = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
};

const formatNumber = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2
  }).format(amount);
};

// ==========================================
// 1. PROFIT & LOSS (INCOME STATEMENT) EXPORTS
// ==========================================

export function exportPLStatementPDF(data: PLStatementData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Calculate Totals
  const totalGrossIncome = data.incomes.reduce((acc, i) => {
    const gross = (i.basic || 0) + (i.hra || 0) + (i.special_allowance || 0) + (i.bonus || 0) + (i.other || 0);
    return acc + (gross > 0 ? gross : i.net_credited || 0);
  }, 0);

  const totalPayrollDeductions = data.incomes.reduce((acc, i) => {
    return acc + (i.epf_deduction || 0) + (i.professional_tax || 0) + (i.tds || 0);
  }, 0);

  const totalNetIncome = data.incomes.reduce((acc, i) => acc + (i.net_credited || 0), 0) || (totalGrossIncome - totalPayrollDeductions);
  const totalExpenses = data.transactions.reduce((acc, t) => acc + (t.amount || 0), 0);
  const netSurplus = totalNetIncome - totalExpenses;
  const savingsRate = totalNetIncome > 0 ? ((netSurplus / totalNetIncome) * 100).toFixed(1) : "0.0";

  // Category breakdown for expenses
  const categoryMap = new Map<string, number>();
  data.transactions.forEach(t => {
    categoryMap.set(t.category_id, (categoryMap.get(t.category_id) || 0) + t.amount);
  });
  const sortedCategories = Array.from(categoryMap.entries()).sort((a, b) => b[1] - a[1]);

  // Header Styling
  doc.setFillColor(26, 26, 26);
  doc.rect(0, 0, pageWidth, 24, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("PERSONAL & FAMILY FINANCE ENGINE", 14, 11);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("FINANCIAL STATEMENT & PROFIT / LOSS SUMMARY", 14, 18);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}`, pageWidth - 14, 18, { align: "right" });

  // Metadata Block
  doc.setTextColor(26, 26, 26);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Reporting Period: ${data.periodLabel}`, 14, 32);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Account / Family: ${data.householdName || "Personal Account"} (${data.userName || "Primary User"})`, 14, 37);

  // Key KPI Cards Table / Box
  const startY = 43;
  const cardW = (pageWidth - 28 - 9) / 4;
  const cards = [
    { title: "TOTAL NET REVENUE", value: formatINR(totalNetIncome), color: [240, 245, 242] as [number, number, number] },
    { title: "TOTAL EXPENDITURES", value: formatINR(totalExpenses), color: [253, 242, 242] as [number, number, number] },
    { title: "NET SURPLUS / (DEFICIT)", value: formatINR(netSurplus), color: netSurplus >= 0 ? [240, 245, 242] as [number, number, number] : [253, 242, 242] as [number, number, number] },
    { title: "SAVINGS RATE", value: `${savingsRate}%`, color: [245, 245, 245] as [number, number, number] }
  ];

  cards.forEach((c, idx) => {
    const x = 14 + idx * (cardW + 3);
    doc.setFillColor(...c.color);
    doc.rect(x, startY, cardW, 16, "F");
    doc.setDrawColor(200, 200, 200);
    doc.rect(x, startY, cardW, 16, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 100, 100);
    doc.text(c.title, x + 3, startY + 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(26, 26, 26);
    doc.text(c.value, x + 3, startY + 12);
  });

  // Table 1: Inflows / Revenue Breakdown
  const incomeRows: any[] = [];
  data.incomes.forEach(i => {
    incomeRows.push(["Basic Salary", formatINR(i.basic || 0)]);
    if (i.hra) incomeRows.push(["House Rent Allowance (HRA)", formatINR(i.hra)]);
    if (i.special_allowance) incomeRows.push(["Special & Other Allowances", formatINR(i.special_allowance)]);
    if (i.bonus) incomeRows.push(["Performance Bonus & Incentives", formatINR(i.bonus)]);
    if (i.other) incomeRows.push(["Other Incomes / Credits", formatINR(i.other)]);
    if (i.epf_deduction) incomeRows.push(["Less: EPF / PF Deduction", `-${formatINR(i.epf_deduction)}`]);
    if (i.professional_tax) incomeRows.push(["Less: Professional Tax (PT)", `-${formatINR(i.professional_tax)}`]);
    if (i.tds) incomeRows.push(["Less: TDS Deducted", `-${formatINR(i.tds)}`]);
    incomeRows.push([{ content: "Net Credited Income", styles: { fontStyle: "bold" } }, { content: formatINR(i.net_credited || 0), styles: { fontStyle: "bold" } }]);
  });

  if (incomeRows.length === 0) {
    incomeRows.push(["Direct Net Income", formatINR(totalNetIncome)]);
  }

  autoTable(doc, {
    startY: 64,
    head: [["REVENUE & CASH INFLOWS", "AMOUNT (INR)"]],
    body: incomeRows,
    theme: "plain",
    headStyles: { fillColor: [26, 26, 26], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2, lineColor: [230, 230, 230], lineWidth: 0.2 },
    columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 60, halign: "right" } },
    margin: { left: 14, right: 14 }
  });

  // Table 2: Operating & Discretionary Spends (Expenses)
  const currentY = (doc as any).lastAutoTable.finalY + 6;
  const expenseRows = sortedCategories.map(([cat, amount]) => [
    cat,
    formatINR(amount),
    totalExpenses > 0 ? `${((amount / totalExpenses) * 100).toFixed(1)}%` : "0%"
  ]);
  expenseRows.push([
    { content: "TOTAL OPERATING EXPENDITURES", styles: { fontStyle: "bold" } } as any,
    { content: formatINR(totalExpenses), styles: { fontStyle: "bold" } } as any,
    { content: "100%", styles: { fontStyle: "bold" } } as any
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [["EXPENDITURES & OUTFLOW CATEGORY", "AMOUNT (INR)", "% OF EXPENSES"]],
    body: expenseRows,
    theme: "plain",
    headStyles: { fillColor: [70, 70, 70], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2, lineColor: [230, 230, 230], lineWidth: 0.2 },
    columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 45, halign: "right" }, 2: { cellWidth: 35, halign: "right" } },
    margin: { left: 14, right: 14 }
  });

  // Summary Footer Box
  const summaryY = (doc as any).lastAutoTable.finalY + 6;
  if (summaryY < doc.internal.pageSize.getHeight() - 35) {
    doc.setFillColor(248, 248, 248);
    doc.rect(14, summaryY, pageWidth - 28, 22, "F");
    doc.setDrawColor(26, 26, 26);
    doc.setLineWidth(0.5);
    doc.rect(14, summaryY, pageWidth - 28, 22, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(26, 26, 26);
    doc.text(`FINANCIAL RESULT: NET ${netSurplus >= 0 ? "SURPLUS" : "DEFICIT"} OF ${formatINR(Math.abs(netSurplus))}`, 18, summaryY + 8);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(70, 70, 70);
    doc.text(`This statement accounts for ${data.transactions.length} verified transactions and ${data.incomes.length} revenue entries.`, 18, summaryY + 14);
    doc.text("Official computer-generated statement from Personal & Family Finance Engine.", 18, summaryY + 18);
  }

  // Footer page numbers
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(130, 130, 130);
    doc.text(`Page ${i} of ${pageCount} — Confidential Financial Report`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: "center" });
  }

  doc.save(`Profit_Loss_Statement_${data.periodLabel.replace(/\s+/g, "_")}.pdf`);
}

export function exportPLStatementExcel(data: PLStatementData) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Executive Summary & P&L
  const totalGrossIncome = data.incomes.reduce((acc, i) => {
    const gross = (i.basic || 0) + (i.hra || 0) + (i.special_allowance || 0) + (i.bonus || 0) + (i.other || 0);
    return acc + (gross > 0 ? gross : i.net_credited || 0);
  }, 0);
  const totalDeductions = data.incomes.reduce((acc, i) => (i.epf_deduction || 0) + (i.professional_tax || 0) + (i.tds || 0), 0);
  const totalNetIncome = data.incomes.reduce((acc, i) => acc + (i.net_credited || 0), 0) || (totalGrossIncome - totalDeductions);
  const totalExpenses = data.transactions.reduce((acc, t) => acc + (t.amount || 0), 0);
  const netSurplus = totalNetIncome - totalExpenses;

  const summaryRows = [
    ["FINANCIAL PROFIT & LOSS STATEMENT"],
    ["Period:", data.periodLabel],
    ["Household / Account:", data.householdName || "Personal"],
    ["Generated On:", new Date().toISOString().split("T")[0]],
    [],
    ["REVENUE / INCOME LINE ITEMS", "AMOUNT (INR)"],
    ...data.incomes.map(i => ["Basic Pay", i.basic || 0]),
    ...data.incomes.filter(i => (i.hra || 0) > 0).map(i => ["HRA Allowance", i.hra]),
    ...data.incomes.filter(i => (i.special_allowance || 0) > 0).map(i => ["Special Allowances", i.special_allowance]),
    ...data.incomes.filter(i => (i.bonus || 0) > 0).map(i => ["Bonus & Incentives", i.bonus]),
    ...data.incomes.filter(i => (i.other || 0) > 0).map(i => ["Other Income", i.other]),
    ["TOTAL GROSS REVENUE", totalGrossIncome],
    [],
    ["PAYROLL DEDUCTIONS", "AMOUNT (INR)"],
    ...data.incomes.filter(i => (i.epf_deduction || 0) > 0).map(i => ["EPF / Provident Fund", i.epf_deduction]),
    ...data.incomes.filter(i => (i.professional_tax || 0) > 0).map(i => ["Professional Tax", i.professional_tax]),
    ...data.incomes.filter(i => (i.tds || 0) > 0).map(i => ["Tax Deducted at Source (TDS)", i.tds]),
    ["TOTAL DEDUCTIONS", totalDeductions],
    ["NET CREDITED REVENUE", totalNetIncome],
    [],
    ["EXPENDITURE SUMMARY", "AMOUNT (INR)"],
    ["Total Expenses", totalExpenses],
    [],
    ["FINANCIAL RESULTS", "AMOUNT (INR)"],
    ["Net Operating Surplus / (Deficit)", netSurplus],
    ["Savings Rate (%)", totalNetIncome > 0 ? (netSurplus / totalNetIncome) * 100 : 0]
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary["!cols"] = [{ wch: 36 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "P&L Statement");

  // Sheet 2: Category Breakdown
  const categoryMap = new Map<string, { spent: number; count: number }>();
  data.transactions.forEach(t => {
    const curr = categoryMap.get(t.category_id) || { spent: 0, count: 0 };
    categoryMap.set(t.category_id, { spent: curr.spent + t.amount, count: curr.count + 1 });
  });

  const catRows = [
    ["Category", "Total Spent (INR)", "Tx Count", "% of Expenses"],
    ...Array.from(categoryMap.entries())
      .sort((a, b) => b[1].spent - a[1].spent)
      .map(([cat, info]) => [
        cat,
        info.spent,
        info.count,
        totalExpenses > 0 ? Number(((info.spent / totalExpenses) * 100).toFixed(2)) : 0
      ])
  ];
  const wsCat = XLSX.utils.aoa_to_sheet(catRows);
  wsCat["!cols"] = [{ wch: 28 }, { wch: 18 }, { wch: 12 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, wsCat, "Category Breakdown");

  // Sheet 3: Full Ledger
  const ledgerRows = [
    ["Date", "Category", "Amount (INR)", "Payment Mode", "Note / Merchant", "Source"],
    ...data.transactions.map(t => [t.date, t.category_id, t.amount, t.payment_mode, t.note || "", t.source])
  ];
  const wsLedger = XLSX.utils.aoa_to_sheet(ledgerRows);
  wsLedger["!cols"] = [{ wch: 14 }, { wch: 24 }, { wch: 16 }, { wch: 16 }, { wch: 32 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsLedger, "Transaction Ledger");

  XLSX.writeFile(wb, `Financial_Statement_${data.periodLabel.replace(/\s+/g, "_")}.xlsx`);
}

export function exportPLStatementCSV(data: PLStatementData) {
  const totalNetIncome = data.incomes.reduce((acc, i) => acc + (i.net_credited || 0), 0);
  const totalExpenses = data.transactions.reduce((acc, t) => acc + (t.amount || 0), 0);
  const netSurplus = totalNetIncome - totalExpenses;

  const rows = [
    ["Financial Statement & Profit/Loss Report"],
    ["Period", data.periodLabel],
    ["Household/Account", data.householdName || "Personal"],
    ["Total Net Inflow (INR)", totalNetIncome],
    ["Total Outflow (INR)", totalExpenses],
    ["Net Surplus/(Deficit) (INR)", netSurplus],
    [],
    ["Date", "Category", "Amount", "Mode", "Note", "Source"],
    ...data.transactions.map(t => [
      t.date,
      t.category_id,
      t.amount,
      t.payment_mode,
      `"${(t.note || "").replace(/"/g, '""')}"`,
      t.source
    ])
  ];

  const csvString = rows.map(r => r.join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `PL_Statement_${data.periodLabel.replace(/\s+/g, "_")}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ==========================================
// 2. CATEGORY SUMMARY & VARIANCE EXPORTS
// ==========================================

export function computeCategorySummaries(
  transactions: Transaction[], 
  budgets: Budget[] = []
): CategorySummaryItem[] {
  const totalExpenses = transactions.reduce((acc, t) => acc + t.amount, 0);
  const categoryMap = new Map<string, { spent: number; count: number }>();
  
  transactions.forEach(t => {
    const cur = categoryMap.get(t.category_id) || { spent: 0, count: 0 };
    categoryMap.set(t.category_id, { spent: cur.spent + t.amount, count: cur.count + 1 });
  });

  // Ensure all budgeted categories also appear even if zero spent
  budgets.forEach(b => {
    if (!categoryMap.has(b.category_id)) {
      categoryMap.set(b.category_id, { spent: 0, count: 0 });
    }
  });

  const budgetMap = new Map<string, number>();
  budgets.forEach(b => {
    budgetMap.set(b.category_id, (budgetMap.get(b.category_id) || 0) + b.limit_amount);
  });

  return Array.from(categoryMap.entries())
    .map(([cat, info]) => {
      const budget = budgetMap.get(cat) || 0;
      const variance = budget > 0 ? budget - info.spent : 0;
      return {
        category: cat,
        spent: info.spent,
        budget,
        variance,
        percentOfTotal: totalExpenses > 0 ? Number(((info.spent / totalExpenses) * 100).toFixed(1)) : 0,
        count: info.count
      };
    })
    .sort((a, b) => b.spent - a.spent);
}

export function exportCategorySummaryPDF(
  items: CategorySummaryItem[], 
  periodLabel: string, 
  householdName?: string
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(26, 26, 26);
  doc.rect(0, 0, pageWidth, 22, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("CATEGORY SPENDING & BUDGET VARIANCE REPORT", 14, 10);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Period: ${periodLabel} | Account: ${householdName || "Personal"}`, 14, 17);
  doc.text(`Export Date: ${new Date().toISOString().split("T")[0]}`, pageWidth - 14, 17, { align: "right" });

  const totalSpent = items.reduce((acc, i) => acc + i.spent, 0);
  const totalBudget = items.reduce((acc, i) => acc + i.budget, 0);
  const totalVariance = totalBudget - totalSpent;

  // Overview Strip
  doc.setTextColor(26, 26, 26);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`Total Spends: ${formatINR(totalSpent)}   |   Total Budget Limit: ${formatINR(totalBudget)}   |   Net Variance: ${formatINR(totalVariance)}`, 14, 30);

  const tableBody = items.map(item => [
    item.category,
    formatINR(item.spent),
    item.budget > 0 ? formatINR(item.budget) : "—",
    item.budget > 0 ? (item.variance >= 0 ? `+${formatINR(item.variance)} (Under)` : `-${formatINR(Math.abs(item.variance))} (Over)`) : "No Budget",
    `${item.percentOfTotal}%`,
    item.count.toString()
  ]);

  tableBody.push([
    { content: "TOTAL / OVERALL", styles: { fontStyle: "bold" } } as any,
    { content: formatINR(totalSpent), styles: { fontStyle: "bold" } } as any,
    { content: totalBudget > 0 ? formatINR(totalBudget) : "—", styles: { fontStyle: "bold" } } as any,
    { content: totalBudget > 0 ? (totalVariance >= 0 ? `+${formatINR(totalVariance)}` : `-${formatINR(Math.abs(totalVariance))}`) : "—", styles: { fontStyle: "bold" } } as any,
    { content: "100%", styles: { fontStyle: "bold" } } as any,
    { content: items.reduce((acc, i) => acc + i.count, 0).toString(), styles: { fontStyle: "bold" } } as any
  ]);

  autoTable(doc, {
    startY: 35,
    head: [["CATEGORY", "SPENT (INR)", "BUDGET", "VARIANCE", "% TOTAL", "TXS"]],
    body: tableBody,
    theme: "striped",
    headStyles: { fillColor: [26, 26, 26], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 32, halign: "right" },
      2: { cellWidth: 30, halign: "right" },
      3: { cellWidth: 38, halign: "right" },
      4: { cellWidth: 20, halign: "right" },
      5: { cellWidth: 15, halign: "center" }
    },
    margin: { left: 14, right: 14 }
  });

  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(130, 130, 130);
    doc.text(`Page ${i} of ${pageCount} — ExpensePlanner Category Analysis`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: "center" });
  }

  doc.save(`Category_Summary_${periodLabel.replace(/\s+/g, "_")}.pdf`);
}

export function exportCategorySummaryExcel(
  items: CategorySummaryItem[], 
  periodLabel: string, 
  householdName?: string
) {
  const wb = XLSX.utils.book_new();
  const rows = [
    ["CATEGORY SPENDING & BUDGET VARIANCE REPORT"],
    ["Period:", periodLabel],
    ["Household / Account:", householdName || "Personal"],
    [],
    ["Category", "Total Spent (INR)", "Budget Limit (INR)", "Variance (INR)", "Status", "% of Total Spends", "Transaction Count"],
    ...items.map(i => [
      i.category,
      i.spent,
      i.budget || 0,
      i.variance,
      i.budget > 0 ? (i.variance >= 0 ? "Under Budget" : "Over Budget") : "Unbudgeted",
      i.percentOfTotal,
      i.count
    ])
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 28 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws, "Category Summary");
  XLSX.writeFile(wb, `Category_Summary_${periodLabel.replace(/\s+/g, "_")}.xlsx`);
}

// ==========================================
// 3. FULL TRANSACTION LEDGER EXPORTS
// ==========================================

export function exportLedgerPDF(
  transactions: Transaction[], 
  periodLabel: string, 
  householdName?: string
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(26, 26, 26);
  doc.rect(0, 0, pageWidth, 22, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("TRANSACTION LEDGER & AUDIT TRAIL", 14, 10);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Period: ${periodLabel} | Account: ${householdName || "Personal"}`, 14, 17);
  doc.text(`Total Records: ${transactions.length}`, pageWidth - 14, 17, { align: "right" });

  const totalAmount = transactions.reduce((acc, t) => acc + t.amount, 0);

  const tableBody = transactions.map(t => [
    t.date,
    t.category_id,
    formatINR(t.amount),
    t.payment_mode,
    t.note || "—",
    t.source
  ]);

  tableBody.push([
    { content: "TOTAL", styles: { fontStyle: "bold" } } as any,
    { content: `${transactions.length} Entries`, styles: { fontStyle: "bold" } } as any,
    { content: formatINR(totalAmount), styles: { fontStyle: "bold" } } as any,
    { content: "", styles: { fontStyle: "bold" } } as any,
    { content: "", styles: { fontStyle: "bold" } } as any,
    { content: "", styles: { fontStyle: "bold" } } as any
  ]);

  autoTable(doc, {
    startY: 28,
    head: [["DATE", "CATEGORY", "AMOUNT", "MODE", "NOTE / MERCHANT", "SOURCE"]],
    body: tableBody,
    theme: "striped",
    headStyles: { fillColor: [26, 26, 26], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7.5 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 35 },
      2: { cellWidth: 28, halign: "right" },
      3: { cellWidth: 22 },
      4: { cellWidth: 55 },
      5: { cellWidth: 20, halign: "center" }
    },
    margin: { left: 14, right: 14 }
  });

  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(130, 130, 130);
    doc.text(`Page ${i} of ${pageCount} — Verified Transaction Ledger`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: "center" });
  }

  doc.save(`Transaction_Ledger_${periodLabel.replace(/\s+/g, "_")}.pdf`);
}

export function exportLedgerExcel(
  transactions: Transaction[], 
  periodLabel: string, 
  householdName?: string
) {
  const wb = XLSX.utils.book_new();
  const rows = [
    ["TRANSACTION LEDGER & AUDIT TRAIL"],
    ["Period:", periodLabel],
    ["Household / Account:", householdName || "Personal"],
    ["Export Date:", new Date().toISOString().split("T")[0]],
    [],
    ["Date", "Category", "Amount (INR)", "Payment Mode", "Note / Merchant", "Source System"],
    ...transactions.map(t => [t.date, t.category_id, t.amount, t.payment_mode, t.note || "", t.source])
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 14 }, { wch: 24 }, { wch: 16 }, { wch: 16 }, { wch: 34 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, ws, "Transactions");
  XLSX.writeFile(wb, `Transaction_Ledger_${periodLabel.replace(/\s+/g, "_")}.xlsx`);
}

export function exportLedgerCSV(
  transactions: Transaction[], 
  periodLabel: string
) {
  const headers = ["Date", "Category", "Amount", "Mode", "Note", "Source"];
  const rows = transactions.map(t => [
    t.date,
    `"${t.category_id}"`,
    t.amount,
    t.payment_mode,
    `"${(t.note || "").replace(/"/g, '""')}"`,
    t.source
  ]);

  const csvString = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob(["\ufeff" + csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Transaction_Ledger_${periodLabel.replace(/\s+/g, "_")}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ==========================================
// 4. TAX FILING PACK EXPORTS (FOR CA / ITR)
// ==========================================

export function exportTaxPackPDF(data: TaxReportData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(26, 26, 26);
  doc.rect(0, 0, pageWidth, 24, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("TAX COMPUTATION & FILING STATEMENT", 14, 11);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Financial Year: ${data.financialYear} (Assessment Year: ${getAssessmentYear(data.financialYear)})`, 14, 18);
  doc.text(`Taxpayer: ${data.userName || "Individual"}`, pageWidth - 14, 18, { align: "right" });

  const totalGrossSalary = data.incomes.reduce((acc, i) => {
    return acc + (i.basic || 0) + (i.hra || 0) + (i.special_allowance || 0) + (i.bonus || 0) + (i.other || 0);
  }, 0);

  const totalEPF = data.incomes.reduce((acc, i) => acc + (i.epf_deduction || 0), 0);
  const totalPT = data.incomes.reduce((acc, i) => acc + (i.professional_tax || 0), 0);
  const totalTDS = data.incomes.reduce((acc, i) => acc + (i.tds || 0), 0);

  const tc = data.taxCalc;
  const eightyC = tc?.eighty_c || totalEPF;
  const eightyD = tc?.eighty_d || 0;
  const hraExemption = tc?.hra_exemption || 0;
  const homeLoanInterest = tc?.home_loan_interest || 0;
  const standardDeduction = 50000;

  // Incomes & Deductions Summary
  const taxRows = [
    ["1. Gross Salary / Professional Income", formatINR(totalGrossSalary || tc?.gross_income || 0)],
    ["2. Less: Standard Deduction (Section 16 ia)", `-${formatINR(standardDeduction)}`],
    ["3. Less: Professional Tax (Section 16 iii)", `-${formatINR(totalPT)}`],
    ["4. Less: House Rent Allowance Exemption (Sec 10 13A)", `-${formatINR(hraExemption)}`],
    ["5. Less: Section 80C Deductions (EPF, ELSS, PPF, Life Ins)", `-${formatINR(Math.min(150000, eightyC))}`],
    ["6. Less: Section 80D Health Insurance Premium", `-${formatINR(Math.min(75000, eightyD))}`],
    ["7. Less: Section 24(b) Home Loan Interest Exemption", `-${formatINR(Math.min(200000, homeLoanInterest))}`],
    ["8. Total TDS (Tax Already Deducted at Source)", formatINR(totalTDS)]
  ];

  if (tc) {
    taxRows.push(["9. Computed Tax Liability (Old Regime)", formatINR(tc.old_regime_tax)]);
    taxRows.push(["10. Computed Tax Liability (New Regime)", formatINR(tc.new_regime_tax)]);
    taxRows.push([{ content: `Recommended Regime: ${tc.recommended_regime.toUpperCase()} REGIME`, styles: { fontStyle: "bold" } } as any, { content: `Tax: ${formatINR(tc.recommended_regime === "old" ? tc.old_regime_tax : tc.new_regime_tax)}`, styles: { fontStyle: "bold" } } as any]);
  }

  autoTable(doc, {
    startY: 32,
    head: [["TAX COMPUTATION SUMMARY (INDIAN INCOME TAX ACT)", "AMOUNT (INR)"]],
    body: taxRows,
    theme: "striped",
    headStyles: { fillColor: [26, 26, 26], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: { 0: { cellWidth: 130 }, 1: { cellWidth: 50, halign: "right" } },
    margin: { left: 14, right: 14 }
  });

  const nextY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Tax Filing Checklist & Notes for CA / Tax Preparer:", 14, nextY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  const checklist = [
    "• Verify Form 26AS & AIS/TIS against the TDS amount reported above.",
    "• Ensure Section 80C investment proofs (ELSS statements, EPF passbook, LIC receipts) are attached.",
    "• Form 16 Part A and Part B should be cross-verified with salary breakdown.",
    "• Rent receipts with Landlord PAN must be provided if claiming HRA exemption > ₹1,00,000/yr."
  ];
  checklist.forEach((item, idx) => {
    doc.text(item, 16, nextY + 6 + idx * 5);
  });

  doc.save(`Tax_Filing_Pack_FY_${data.financialYear}.pdf`);
}

function getAssessmentYear(fy: string): string {
  try {
    const parts = fy.split("-");
    const y1 = parseInt(parts[0], 10);
    const y2 = parseInt(parts[1], 10);
    return `${y1 + 1}-${y2 + 1}`;
  } catch {
    return "AY";
  }
}
