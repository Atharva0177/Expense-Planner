import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getTransactions, getIncomes, addTransaction } from "../lib/db";
import { Transaction } from "../types";
import { Download, Upload, BarChart3, PieChart as PieChartIcon } from "lucide-react";
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

const PIE_COLORS = ['#1A1A1A', '#2A4B3A', '#4A4A4A', '#7A7A7A', '#A3A3A3', '#CCCCCC', '#E5E2DE'];

export function ReportSection({ currentMonth }: { currentMonth: string }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // Data States
  const [pieData, setPieData] = useState<{ name: string; value: number }[]>([]);
  const [trendData, setTrendData] = useState<{ month: string; income: number; expense: number }[]>([]);
  const [currentTransactions, setCurrentTransactions] = useState<Transaction[]>([]);

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

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const months = getLast6Months(currentMonth);
    
    // Fetch Trend Data
    const trendPromises = months.map(async (m) => {
      const txs = await getTransactions(user.uid, m);
      const incs = await getIncomes(user.uid, m);
      
      const expense = txs.reduce((sum, t) => sum + t.amount, 0);
      const income = incs.reduce((sum, i) => sum + i.net_credited, 0);
      
      return { month: m, income, expense, txs };
    });

    const trendResults = await Promise.all(trendPromises);
    setTrendData(trendResults.map(r => ({ month: r.month, income: r.income, expense: r.expense })));

    // Extract current month for pie chart
    const currentMonthData = trendResults.find(r => r.month === currentMonth);
    if (currentMonthData) {
      setCurrentTransactions(currentMonthData.txs);
      
      const categoryMap = new Map<string, number>();
      currentMonthData.txs.forEach(t => {
        categoryMap.set(t.category_id, (categoryMap.get(t.category_id) || 0) + t.amount);
      });
      
      const pie = Array.from(categoryMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
        
      setPieData(pie);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user, currentMonth]);

  const handleExportCSV = () => {
    if (currentTransactions.length === 0) {
      alert("No transactions to export for this month.");
      return;
    }

    const headers = ["Date", "Category", "Amount", "Mode", "Note", "Source"];
    const rows = currentTransactions.map(t => [
      t.date,
      t.category_id,
      t.amount,
      t.payment_mode,
      t.note || "",
      t.source
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ExpensePlanner_Export_${currentMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      
      {/* Top Controls: Export & Import */}
      <div className="bg-white border border-[#1A1A1A] p-4 sm:p-6 shadow-[4px_4px_0px_#1A1A1A] sm:shadow-[8px_8px_0px_#1A1A1A] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif italic text-[#1A1A1A]">Data Operations</h2>
          <p className="text-[10px] uppercase font-mono tracking-widest text-[#666] mt-0.5">Export / Import CSV</p>
        </div>
        <div className="flex flex-wrap w-full sm:w-auto gap-2.5 sm:gap-3">
          <button 
            onClick={handleExportCSV} 
            className="flex-1 sm:flex-none border border-[#1A1A1A] bg-white px-3 sm:px-4 py-2 text-[10px] uppercase font-bold tracking-widest hover:bg-gray-100 transition-colors inline-flex items-center justify-center gap-1.5 touch-manipulation min-h-[36px]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          
          <div className="relative overflow-hidden flex-1 sm:flex-none">
            <button className="w-full bg-[#1A1A1A] text-white px-3 sm:px-4 py-2 text-[10px] uppercase font-bold tracking-widest hover:bg-gray-800 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 touch-manipulation min-h-[36px]">
              <Upload className="w-3.5 h-3.5" />
              <span>Import CSV</span>
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
        <div className="bg-[#F0F5F2] border border-[#2A4B3A] p-4 sm:p-6 shadow-[4px_4px_0px_#2A4B3A] sm:shadow-[8px_8px_0px_#2A4B3A]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b border-[#2A4B3A] pb-2 gap-2">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#2A4B3A]">
              Import Queue ({importQueue.length} items ready)
            </h3>
            <div className="flex gap-3 self-end sm:self-auto">
              <button 
                onClick={() => setImportQueue([])} 
                className="text-[10px] font-bold uppercase tracking-widest text-red-700 hover:underline touch-manipulation py-1"
              >
                Cancel
              </button>
              <button 
                onClick={processImportQueue} 
                disabled={isImporting} 
                className="bg-[#2A4B3A] text-white px-3 sm:px-4 py-1 text-[10px] font-bold uppercase tracking-widest hover:opacity-90 touch-manipulation"
              >
                {isImporting ? "Importing..." : "Confirm Import"}
              </button>
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto overflow-x-auto border border-[#2A4B3A]">
            <table className="w-full text-left border-collapse text-xs font-mono min-w-[300px] bg-white">
              <thead>
                <tr className="border-b border-[#2A4B3A] text-[9px] uppercase bg-[#2A4B3A] text-white sticky top-0">
                  <th className="py-1.5 px-2">Date</th>
                  <th className="py-1.5 px-2">Category</th>
                  <th className="py-1.5 px-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {importQueue.slice(0, 50).map((row, idx) => (
                  <tr key={idx} className="border-b border-dotted border-gray-300 hover:bg-[#F0F5F2]">
                    <td className="py-1 px-2">{row.date}</td>
                    <td className="py-1 px-2">{row.category_id}</td>
                    <td className="py-1 px-2 text-right font-bold">₹{row.amount?.toLocaleString()}</td>
                  </tr>
                ))}
                {importQueue.length > 50 && (
                  <tr>
                    <td colSpan={3} className="py-2 text-center text-[10px] italic text-[#666]">
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
        <p className="text-xs font-mono uppercase tracking-widest text-[#666] py-4">Loading Reports...</p>
      ) : (
        <div className="grid grid-cols-12 gap-6 sm:gap-8">
          
          {/* Trend Chart (6 Months) */}
          <div className="col-span-12 lg:col-span-8 bg-white border border-[#1A1A1A] p-4 sm:p-6 md:p-8 shadow-[4px_4px_0px_#1A1A1A] sm:shadow-[8px_8px_0px_#1A1A1A]">
            <div className="flex items-center gap-2 mb-4 sm:mb-6 border-b-2 border-[#1A1A1A] pb-2">
              <BarChart3 className="w-5 h-5" />
              <h2 className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-[#1A1A1A]">
                6-Month Trend
              </h2>
            </div>
            <div className="h-60 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E2DE" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#1A1A1A', fontFamily: 'monospace' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#666', fontFamily: 'monospace' }} />
                  <Tooltip 
                    cursor={{ fill: '#FCFAF7' }} 
                    contentStyle={{ backgroundColor: '#1A1A1A', border: 'none', color: '#fff', fontSize: '11px', fontFamily: 'monospace', borderRadius: '0px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend iconType="square" wrapperStyle={{ fontSize: '9px', fontFamily: 'monospace', textTransform: 'uppercase', marginTop: '10px' }} />
                  <Bar dataKey="income" name="Income" fill="#2A4B3A" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#1A1A1A" radius={[0, 0, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart (Current Month Expense Split) */}
          <div className="col-span-12 lg:col-span-4 bg-white border border-[#1A1A1A] p-4 sm:p-6 md:p-8 shadow-[4px_4px_0px_#1A1A1A] sm:shadow-[8px_8px_0px_#1A1A1A] flex flex-col">
            <div className="flex items-center gap-2 mb-4 sm:mb-6 border-b-2 border-[#1A1A1A] pb-2">
              <PieChartIcon className="w-5 h-5" />
              <h2 className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-[#1A1A1A]">
                Expense Split
              </h2>
            </div>
            {pieData.length === 0 ? (
              <p className="text-xs font-mono uppercase tracking-widest text-[#666] flex-grow flex items-center justify-center py-12">
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
                      contentStyle={{ backgroundColor: '#1A1A1A', border: 'none', color: '#fff', fontSize: '11px', fontFamily: 'monospace', borderRadius: '0px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-[#666]">Total</span>
                  <span className="font-serif italic font-bold text-sm sm:text-base">
                    ₹{trendData.find(t => t.month === currentMonth)?.expense.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
            
            {pieData.length > 0 && (
              <div className="mt-3 max-h-36 overflow-y-auto border-t border-dotted border-gray-300 pt-2">
                <table className="w-full text-xs font-mono">
                  <tbody>
                    {pieData.map((entry, index) => (
                      <tr key={index} className="border-b border-dotted border-gray-200">
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
