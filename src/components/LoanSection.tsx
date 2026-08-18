import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getLoans, addLoan, getLoanSchedule, saveLoanSchedule, clearLoanSchedule, addRecurringRule } from "../lib/db";
import { calculateEMI, generateAmortizationSchedule } from "../lib/loanUtils";
import { Loan, LoanSchedule } from "../types";
import { ArrowLeft, PlusCircle, Calculator, ChevronRight } from "lucide-react";

export function LoanSection() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [schedule, setSchedule] = useState<LoanSchedule[]>([]);

  // New Loan Form
  const [principal, setPrincipal] = useState<number>(0);
  const [rate, setRate] = useState<number>(0);
  const [tenure, setTenure] = useState<number>(0);
  const [startDate, setStartDate] = useState<string>("");

  // Prepayment Form
  const [prepayMonth, setPrepayMonth] = useState<number>(1);
  const [prepayAmount, setPrepayAmount] = useState<number>(0);

  const fetchLoans = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getLoans(user.uid);
      setLoans(data || []);
    } catch (e) {
      console.warn("Notice loading loans:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [user]);

  const handleAddLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || principal <= 0 || rate <= 0 || tenure <= 0) return;
    
    const emi = calculateEMI(principal, rate, tenure);
    const loanId = await addLoan({
      user_id: user.uid,
      principal,
      interest_rate: rate,
      tenure_months: tenure,
      start_date: startDate,
      emi_amount: emi
    });

    // Create Schedule
    const newSchedule = generateAmortizationSchedule(loanId, user.uid, principal, rate, tenure, emi);
    await saveLoanSchedule(newSchedule);

    // Add recurring rule for EMI
    let d = new Date(startDate || new Date());
    d.setMonth(d.getMonth() + 1);
    await addRecurringRule({
      user_id: user.uid,
      category_id: "EMI",
      amount: emi,
      frequency: "monthly",
      next_due_date: d.toISOString().split("T")[0],
      label: `Loan EMI - ₹${(principal/100000).toFixed(1)}L`,
      active: true
    });

    setPrincipal(0); setRate(0); setTenure(0); setStartDate("");
    fetchLoans();
  };

  const viewLoan = async (loan: Loan) => {
    setSelectedLoan(loan);
    if (!user || !loan.id) return;
    const sched = await getLoanSchedule(loan.id, user.uid);
    setSchedule(sched);
  };

  const handlePrepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedLoan || !selectedLoan.id || prepayAmount <= 0) return;

    // Find existing prepayments
    const prepayments = schedule
      .filter(s => s.is_prepayment)
      .map(s => ({ month: s.month_number, amount: s.principal_component }));
      
    // Add new prepayment
    prepayments.push({ month: prepayMonth, amount: prepayAmount });

    // Regenerate
    const newSchedule = generateAmortizationSchedule(
      selectedLoan.id,
      user.uid,
      selectedLoan.principal,
      selectedLoan.interest_rate,
      selectedLoan.tenure_months,
      selectedLoan.emi_amount,
      prepayments
    );

    // Save
    await clearLoanSchedule(selectedLoan.id, user.uid);
    await saveLoanSchedule(newSchedule);

    setPrepayAmount(0);
    viewLoan(selectedLoan);
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {selectedLoan ? (
        <div className="bg-white dark:bg-[#1A1A1A] border border-[#1A1A1A] dark:border-[#383838] p-4 sm:p-6 md:p-8 shadow-[4px_4px_0px_#1A1A1A] sm:shadow-[8px_8px_0px_#1A1A1A] dark:shadow-[8px_8px_0px_#000] flex flex-col min-h-[500px]">
          <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-6 border-b-2 border-[#1A1A1A] dark:border-[#383838] pb-4 shrink-0 gap-3">
            <div>
              <button 
                onClick={() => setSelectedLoan(null)} 
                className="text-[10px] uppercase font-bold tracking-widest text-[#666] dark:text-[#A0A0A0] hover:text-[#1A1A1A] dark:hover:text-[#F0ECE1] mb-2 inline-flex items-center gap-1 touch-manipulation py-1"
              >
                <ArrowLeft className="w-3 h-3" /> Back to Loans
              </button>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#1A1A1A] dark:text-[#F0ECE1]">Loan Schedule</h2>
              <p className="text-xs font-mono uppercase tracking-wider text-[#666] dark:text-[#A0A0A0] mt-1">
                ₹{selectedLoan.principal.toLocaleString()} • {selectedLoan.interest_rate}% p.a. • {selectedLoan.tenure_months} mo
              </p>
            </div>
            <div className="bg-[#FCFAF7] dark:bg-[#242424] p-2 sm:p-0 border sm:border-0 border-[#1A1A1A] dark:border-[#444]">
              <p className="text-[10px] uppercase font-bold tracking-widest text-[#666] dark:text-[#A0A0A0] sm:text-right">Monthly EMI</p>
              <p className="text-2xl sm:text-3xl font-serif font-bold text-red-700 dark:text-rose-400 sm:text-right">₹{selectedLoan.emi_amount.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex-grow flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Schedule Table */}
            <div className="flex-1 max-h-[400px] lg:max-h-[500px] overflow-y-auto pr-0 lg:pr-4 overflow-x-auto border border-[#1A1A1A] dark:border-[#383838]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1A1A1A] dark:border-[#383838] text-[9px] uppercase tracking-widest bg-[#1A1A1A] dark:bg-[#282828] text-white sticky top-0">
                    <th className="py-2.5 px-2">Month</th>
                    <th className="py-2.5 px-2 text-right">Principal</th>
                    <th className="py-2.5 px-2 text-right">Interest</th>
                    <th className="py-2.5 px-2 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-mono">
                  {schedule.map((row, idx) => (
                    <tr key={idx} className={`border-b border-[#1A1A1A] dark:border-[#333] border-dotted hover:bg-[#FCFAF7] dark:hover:bg-[#242424] ${row.is_prepayment ? 'bg-[#F0F5F2] dark:bg-emerald-950/40 text-[#2A4B3A] dark:text-emerald-400 font-bold' : 'text-[#1A1A1A] dark:text-[#F0ECE1]'}`}>
                      <td className="py-2 px-2">
                        {row.month_number} {row.is_prepayment && <span className="text-[9px] bg-green-200 dark:bg-emerald-900 px-1 py-0.5 ml-1 text-green-900 dark:text-emerald-200 font-bold uppercase">Prepay</span>}
                      </td>
                      <td className="py-2 px-2 text-right">₹{row.principal_component.toLocaleString()}</td>
                      <td className="py-2 px-2 text-right text-red-700 dark:text-rose-400">₹{row.interest_component.toLocaleString()}</td>
                      <td className="py-2 px-2 text-right font-semibold">₹{row.outstanding_balance.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Prepayment Actions */}
            <div className="w-full lg:w-72 shrink-0 border border-[#1A1A1A] dark:border-[#383838] p-4 bg-[#FCFAF7] dark:bg-[#242424]">
              <p className="text-[10px] uppercase font-bold tracking-widest border-b border-[#1A1A1A] dark:border-[#383838] pb-1 mb-3 text-[#1A1A1A] dark:text-[#E0E0E0]">Add Prepayment</p>
              <form onSubmit={handlePrepayment} className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">Month Number</label>
                  <input 
                    type="number" 
                    min={1} 
                    max={schedule.length} 
                    required 
                    value={prepayMonth} 
                    onChange={e => setPrepayMonth(Number(e.target.value))} 
                    className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none focus:border-[2px] font-mono text-xs" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">Amount (₹)</label>
                  <input 
                    type="number" 
                    min={1} 
                    required 
                    placeholder="0"
                    value={prepayAmount || ''} 
                    onChange={e => setPrepayAmount(Number(e.target.value))} 
                    className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none focus:border-[2px] font-mono text-xs font-bold" 
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-[#2A4B3A] dark:bg-emerald-700 text-white py-2.5 px-3 font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-opacity active:scale-95 touch-manipulation min-h-[38px] flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#1A1A1A] dark:shadow-[2px_2px_0px_#000]"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Apply & Recalculate</span>
                </button>
              </form>
              <p className="text-[9px] uppercase font-mono mt-3 text-[#666] dark:text-[#A0A0A0] leading-relaxed">
                Prepayments reduce the total tenure while keeping the EMI constant.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* New Loan Form */}
          <div className="bg-white dark:bg-[#1A1A1A] border border-[#1A1A1A] dark:border-[#383838] p-4 sm:p-6 md:p-8 relative shadow-[3px_3px_0px_#1A1A1A] sm:shadow-[6px_6px_0px_#1A1A1A] dark:shadow-[6px_6px_0px_#000]">
            <span className="absolute -top-3 left-4 bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest">
              Add New Loan
            </span>
            <form onSubmit={handleAddLoan} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 items-end mt-2">
              <div className="sm:col-span-1 lg:col-span-3">
                <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">Principal (₹)</label>
                <input 
                  type="number" 
                  required 
                  min="1000"
                  placeholder="e.g. 500000"
                  value={principal || ''} 
                  onChange={e => setPrincipal(Number(e.target.value))} 
                  className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none focus:border-[2px] dark:focus:border-white font-mono text-xs font-semibold" 
                />
              </div>
              <div className="sm:col-span-1 lg:col-span-2">
                <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">Rate (% p.a.)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  required 
                  min="0.1"
                  placeholder="e.g. 8.5"
                  value={rate || ''} 
                  onChange={e => setRate(Number(e.target.value))} 
                  className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none focus:border-[2px] dark:focus:border-white font-mono text-xs" 
                />
              </div>
              <div className="sm:col-span-1 lg:col-span-2">
                <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">Tenure (Months)</label>
                <input 
                  type="number" 
                  required 
                  min="1"
                  placeholder="e.g. 60"
                  value={tenure || ''} 
                  onChange={e => setTenure(Number(e.target.value))} 
                  className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none focus:border-[2px] dark:focus:border-white font-mono text-xs" 
                />
              </div>
              <div className="sm:col-span-1 lg:col-span-3">
                <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">Start Date</label>
                <input 
                  type="date" 
                  required 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)} 
                  className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none focus:border-[2px] dark:focus:border-white font-mono text-xs" 
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-2">
                <button 
                  type="submit" 
                  className="w-full bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] py-2.5 px-4 font-bold uppercase tracking-widest text-xs hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors active:scale-95 touch-manipulation min-h-[38px] flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#777] dark:shadow-[2px_2px_0px_#000]"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Calculate & Add</span>
                </button>
              </div>
            </form>
          </div>

          {/* List View */}
          <div className="bg-white dark:bg-[#1A1A1A] border border-[#1A1A1A] dark:border-[#383838] shadow-[4px_4px_0px_#1A1A1A] sm:shadow-[8px_8px_0px_#1A1A1A] dark:shadow-[8px_8px_0px_#000] p-4 sm:p-6 md:p-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold tracking-tight text-[#1A1A1A] dark:text-[#F0ECE1] mb-4 sm:mb-6 border-b-2 border-[#1A1A1A] dark:border-[#383838] pb-2">
              Active Loans
            </h2>
            
            {loading ? (
              <p className="text-xs font-mono uppercase tracking-widest text-[#666] dark:text-[#A0A0A0] py-4">Loading loans...</p>
            ) : loans.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424]">
                <p className="text-xs font-mono uppercase tracking-widest text-[#666] dark:text-[#A0A0A0]">No loans configured yet. Add your loan details above to calculate EMI & amortization schedule.</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {loans.map(loan => (
                  <div key={loan.id} className="border border-[#1A1A1A] dark:border-[#383838] p-3.5 sm:p-4 bg-[#FCFAF7] dark:bg-[#242424] flex flex-col sm:flex-row justify-between sm:items-center gap-3 shadow-[2px_2px_0px_#1A1A1A] dark:shadow-[2px_2px_0px_#000]">
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-[#666] dark:text-[#A0A0A0] mb-0.5">Principal Loan Amount</p>
                      <p className="text-xl sm:text-2xl font-serif font-bold text-[#1A1A1A] dark:text-[#F0ECE1]">₹{loan.principal.toLocaleString()}</p>
                      <p className="text-[10px] font-mono uppercase text-[#666] dark:text-[#A0A0A0] mt-0.5">
                        {loan.interest_rate}% p.a. • {loan.tenure_months} months
                      </p>
                    </div>
                    <div className="flex sm:flex-col justify-between sm:text-right items-center sm:items-end border-t sm:border-t-0 border-gray-300 dark:border-[#383838] pt-2 sm:pt-0">
                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-[#666] dark:text-[#A0A0A0]">EMI Amount</p>
                        <p className="text-lg sm:text-xl font-serif font-bold text-red-700 dark:text-rose-400">₹{loan.emi_amount.toLocaleString()}</p>
                      </div>
                      <button 
                        onClick={() => viewLoan(loan)} 
                        className="mt-1 sm:mt-2 text-[10px] uppercase font-bold tracking-widest border border-[#1A1A1A] dark:border-[#444] sm:border-0 sm:border-b bg-white dark:bg-[#1A1A1A] sm:bg-transparent px-2.5 py-1 sm:px-0 sm:py-0 text-[#1A1A1A] dark:text-[#F0ECE1] hover:bg-[#1A1A1A] hover:text-white dark:hover:bg-white dark:hover:text-[#121212] sm:hover:bg-transparent sm:hover:text-[#1A1A1A] sm:dark:hover:text-white sm:hover:opacity-70 transition-all inline-flex items-center gap-1 touch-manipulation"
                      >
                        <span>Schedule</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
