import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getTransactions, getIncomes, getBudgets, getGoals, getLoans } from "../lib/db";
import { Transaction, IncomeEntry, Budget, Goal, Loan, HouseholdMember } from "../types";
import { getHouseholdMembers, getHouseholdMembership } from "../lib/db_household";

export function OverviewSection({ currentMonth }: { currentMonth: string }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [showMemberBreakdown, setShowMemberBreakdown] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchData() {
      if (!user) {
        if (isMounted) setLoading(false);
        return;
      }
      if (isMounted) setLoading(true);
      
      try {
        const [txData, incData, budData, goalData, loanData] = await Promise.all([
          getTransactions(user.uid, currentMonth),
          getIncomes(user.uid, currentMonth),
          getBudgets(user.uid, currentMonth),
          getGoals(user.uid),
          getLoans(user.uid)
        ]);
        
        if (!isMounted) return;
        setTransactions(txData || []);
        setIncomeEntries(incData || []);
        setBudgets(budData || []);
        setGoals(goalData || []);
        setLoans(loanData || []);
        
        const m = await getHouseholdMembership(user.uid);
        if (m && isMounted) {
          const hhMembers = await getHouseholdMembers(m.household_id);
          if (isMounted) setMembers(hhMembers || []);
        }
      } catch (err) {
        console.warn("Notice fetching overview data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    
    fetchData();

    return () => {
      isMounted = false;
    };
  }, [user, currentMonth]);

  if (loading) {
    return <div className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] animate-pulse">Loading Overview...</div>;
  }

  // Calculate totals
  const totalIncome = incomeEntries.reduce((sum, entry) => sum + (entry.net_credited || 0), 0);
  const totalExpenses = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const savings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((savings / totalIncome) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-[#1A1A1A] pb-2">
        <h2 className="text-xl sm:text-2xl font-serif italic tracking-tight text-[#1A1A1A]">Financial Overview</h2>
        <label className="flex items-center gap-2 cursor-pointer text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] py-1">
          <input type="checkbox" checked={showMemberBreakdown} onChange={e => setShowMemberBreakdown(e.target.checked)} className="accent-[#1A1A1A] w-3.5 h-3.5" />
          Show Member Breakdown
        </label>
      </div>
      
      {showMemberBreakdown && members.length > 0 && (
        <div className="border border-[#1A1A1A] bg-white p-4 sm:p-6 shadow-[3px_3px_0px_#1A1A1A] sm:shadow-[4px_4px_0px_#1A1A1A]">
          <h3 className="text-base sm:text-lg font-serif italic tracking-tight text-[#1A1A1A] mb-3 border-b border-[#1A1A1A] pb-2">Member Breakdown</h3>
          
          {/* Mobile Cards */}
          <div className="block sm:hidden space-y-3">
            {members.map(m => {
              const mInc = incomeEntries.filter(i => i.user_id === m.user_id).reduce((sum, i) => sum + (i.net_credited || 0), 0);
              const mExp = transactions.filter(t => t.user_id === m.user_id).reduce((sum, t) => sum + t.amount, 0);
              return (
                <div key={m.id} className="border border-dashed border-[#1A1A1A] p-3 bg-[#FCFAF7]">
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="font-mono text-xs font-bold truncate max-w-[180px]">{m.email}</span>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 bg-black text-white font-mono">{m.role}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                    <div>
                      <span className="text-[9px] text-[#666] block uppercase">Income</span>
                      <span className="text-green-700 font-bold">₹{mInc.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#666] block uppercase">Expenses</span>
                      <span className="text-red-700 font-bold">₹{mExp.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-[#1A1A1A] text-[10px] uppercase tracking-widest text-[#555]">
                  <th className="p-2 font-bold">Member</th>
                  <th className="p-2 font-bold">Role</th>
                  <th className="p-2 font-bold">Income</th>
                  <th className="p-2 font-bold">Expenses</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => {
                  const mInc = incomeEntries.filter(i => i.user_id === m.user_id).reduce((sum, i) => sum + (i.net_credited || 0), 0);
                  const mExp = transactions.filter(t => t.user_id === m.user_id).reduce((sum, t) => sum + t.amount, 0);
                  return (
                    <tr key={m.id} className="border-b border-[#1A1A1A] border-dotted text-xs font-mono">
                      <td className="p-2">{m.email}</td>
                      <td className="p-2 uppercase text-[10px]">{m.role}</td>
                      <td className="p-2 text-green-700 font-semibold">₹{mInc.toLocaleString()}</td>
                      <td className="p-2 text-red-700 font-semibold">₹{mExp.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        {/* Total Income */}
        <div className="border border-[#1A1A1A] bg-white p-4 sm:p-6 shadow-[3px_3px_0px_#1A1A1A] sm:shadow-[4px_4px_0px_#1A1A1A]">
          <p className="text-[10px] uppercase font-bold tracking-widest text-[#555] mb-1 sm:mb-2">Total Income ({currentMonth})</p>
          <p className="text-2xl sm:text-3xl font-mono text-green-700 font-bold">₹{totalIncome.toLocaleString()}</p>
        </div>

        {/* Total Expenses */}
        <div className="border border-[#1A1A1A] bg-white p-4 sm:p-6 shadow-[3px_3px_0px_#1A1A1A] sm:shadow-[4px_4px_0px_#1A1A1A]">
          <p className="text-[10px] uppercase font-bold tracking-widest text-[#555] mb-1 sm:mb-2">Total Expenses ({currentMonth})</p>
          <p className="text-2xl sm:text-3xl font-mono text-red-700 font-bold">₹{totalExpenses.toLocaleString()}</p>
        </div>

        {/* Savings */}
        <div className="border border-[#1A1A1A] bg-white p-4 sm:p-6 shadow-[3px_3px_0px_#1A1A1A] sm:shadow-[4px_4px_0px_#1A1A1A]">
          <p className="text-[10px] uppercase font-bold tracking-widest text-[#555] mb-1 sm:mb-2">Savings ({currentMonth})</p>
          <p className="text-2xl sm:text-3xl font-mono text-[#1A1A1A] font-bold">₹{savings.toLocaleString()}</p>
          <p className="text-[10px] uppercase font-bold tracking-widest text-[#555] mt-1 sm:mt-2">Rate: {savingsRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Budgets Summary */}
        <div className="border border-[#1A1A1A] bg-white p-4 sm:p-6 shadow-[3px_3px_0px_#1A1A1A] sm:shadow-[4px_4px_0px_#1A1A1A]">
          <h3 className="text-base sm:text-lg font-serif italic tracking-tight text-[#1A1A1A] mb-3 sm:mb-4 border-b border-[#1A1A1A] pb-2">Top Budget Limits</h3>
          {budgets.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {budgets.slice(0, 5).map(b => {
                const spent = transactions.filter(t => t.category_id === b.category_id).reduce((sum, t) => sum + t.amount, 0);
                const percent = Math.min(100, Math.round((spent / b.limit_amount) * 100));
                return (
                  <div key={b.id}>
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest mb-1 gap-2">
                      <span className="truncate">{b.category_id}</span>
                      <span className="shrink-0">₹{spent.toLocaleString()} / ₹{b.limit_amount.toLocaleString()} ({percent}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2">
                      <div 
                        className={`h-full ${percent > 90 ? 'bg-red-700' : percent > 75 ? 'bg-yellow-500' : 'bg-[#1A1A1A]'}`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[10px] uppercase font-bold tracking-widest text-[#555]">No budgets set for this month.</p>
          )}
        </div>

        {/* Goals Summary */}
        <div className="border border-[#1A1A1A] bg-white p-4 sm:p-6 shadow-[3px_3px_0px_#1A1A1A] sm:shadow-[4px_4px_0px_#1A1A1A]">
          <h3 className="text-base sm:text-lg font-serif italic tracking-tight text-[#1A1A1A] mb-3 sm:mb-4 border-b border-[#1A1A1A] pb-2">Active Goals</h3>
          {goals.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {goals.slice(0, 5).map(g => {
                const percent = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100));
                return (
                  <div key={g.id}>
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest mb-1 gap-2">
                      <span className="truncate">{g.name}</span>
                      <span className="shrink-0">₹{g.current_amount.toLocaleString()} / ₹{g.target_amount.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2">
                      <div 
                        className="h-full bg-green-700"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[10px] uppercase font-bold tracking-widest text-[#555]">No active goals.</p>
          )}
        </div>

        {/* Loans Summary */}
        <div className="border border-[#1A1A1A] bg-white p-4 sm:p-6 shadow-[3px_3px_0px_#1A1A1A] sm:shadow-[4px_4px_0px_#1A1A1A] md:col-span-2">
          <h3 className="text-base sm:text-lg font-serif italic tracking-tight text-[#1A1A1A] mb-3 sm:mb-4 border-b border-[#1A1A1A] pb-2">Active Loans</h3>
          {loans.length > 0 ? (
            <div>
              {/* Mobile Loan Cards */}
              <div className="block sm:hidden space-y-3">
                {loans.map(loan => (
                  <div key={loan.id} className="border border-dashed border-[#1A1A1A] p-3 bg-[#FCFAF7]">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-[9px] uppercase text-[#666] block">Principal</span>
                        <span className="font-mono text-sm font-bold">₹{loan.principal.toLocaleString()}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] uppercase text-[#666] block">EMI Amount</span>
                        <span className="font-mono text-sm font-bold text-red-700">₹{loan.emi_amount.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-[#555] pt-1 border-t border-dotted border-gray-300">
                      <span>Rate: {loan.interest_rate}%</span>
                      <span>Tenure: {loan.tenure_months} mo</span>
                      <span>Start: {loan.start_date}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-[#1A1A1A] text-[10px] uppercase tracking-widest text-[#555]">
                      <th className="p-2 font-bold">Principal</th>
                      <th className="p-2 font-bold">Interest Rate</th>
                      <th className="p-2 font-bold">EMI</th>
                      <th className="p-2 font-bold">Tenure</th>
                      <th className="p-2 font-bold">Start Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.map(loan => (
                      <tr key={loan.id} className="border-b border-[#1A1A1A] border-dotted text-xs font-mono hover:bg-gray-50">
                        <td className="p-2 font-semibold">₹{loan.principal.toLocaleString()}</td>
                        <td className="p-2">{loan.interest_rate}%</td>
                        <td className="p-2 text-red-700 font-semibold">₹{loan.emi_amount.toLocaleString()}</td>
                        <td className="p-2">{loan.tenure_months} mo</td>
                        <td className="p-2">{loan.start_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-[10px] uppercase font-bold tracking-widest text-[#555]">No active loans.</p>
          )}
        </div>
      </div>
    </div>
  );
}
