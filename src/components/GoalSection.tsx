import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getGoals, addGoal, updateGoal, deleteGoal, addRecurringRule, getRecurringRules } from "../lib/db";
import { Goal, RecurringRule } from "../types";
import { PlusCircle, Target, CheckCircle2, Trash2 } from "lucide-react";

export function GoalSection() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>([]);
  const [loading, setLoading] = useState(true);

  // New Goal Form
  const [name, setName] = useState<string>("");
  const [targetAmount, setTargetAmount] = useState<number>(0);
  const [currentAmount, setCurrentAmount] = useState<number>(0);
  const [targetDate, setTargetDate] = useState<string>("");
  const [monthlyContribution, setMonthlyContribution] = useState<number>(0);

  // Manual Contribution Form State
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState<number>(0);

  const fetchData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [goalsData, rulesData] = await Promise.all([
        getGoals(user.uid),
        getRecurringRules(user.uid)
      ]);
      setGoals(goalsData || []);
      setRecurringRules(rulesData || []);
    } catch (e) {
      console.warn("Notice loading goals:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || targetAmount <= 0) return;

    let linkedRuleId = null;

    if (monthlyContribution > 0) {
      let d = new Date();
      d.setMonth(d.getMonth() + 1);
      linkedRuleId = await addRecurringRule({
        user_id: user.uid,
        category_id: "SIP/Investments",
        amount: monthlyContribution,
        frequency: "monthly",
        next_due_date: d.toISOString().split("T")[0],
        label: `Auto-save: ${name}`,
        active: true
      });
    }

    await addGoal({
      user_id: user.uid,
      name,
      target_amount: targetAmount,
      current_amount: currentAmount,
      target_date: targetDate,
      linked_recurring_rule_id: linkedRuleId
    });

    setName("");
    setTargetAmount(0);
    setCurrentAmount(0);
    setTargetDate("");
    setMonthlyContribution(0);
    fetchData();
  };

  const handleManualContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributeGoalId || contributeAmount <= 0) return;
    
    const goal = goals.find(g => g.id === contributeGoalId);
    if (!goal) return;

    await updateGoal(contributeGoalId, {
      current_amount: goal.current_amount + contributeAmount
    });

    setContributeGoalId(null);
    setContributeAmount(0);
    fetchData();
  };

  const handleDelete = async (goalId: string) => {
    if (window.confirm("Delete this savings goal?")) {
      await deleteGoal(goalId);
      fetchData();
    }
  };

  const calculateProjection = (goal: Goal, rule?: RecurringRule) => {
    if (!rule || rule.amount <= 0) return null;
    const remaining = Math.max(0, goal.target_amount - goal.current_amount);
    if (remaining === 0) return "Completed";
    
    const months = Math.ceil(remaining / rule.amount);
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split("T")[0];
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* New Goal Form */}
      <div className="bg-white dark:bg-[#1A1A1A] border border-[#1A1A1A] dark:border-[#383838] p-4 sm:p-6 md:p-8 relative shadow-[3px_3px_0px_#1A1A1A] sm:shadow-[6px_6px_0px_#1A1A1A] dark:shadow-[6px_6px_0px_#000]">
        <span className="absolute -top-3 left-4 bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest">
          Create Goal
        </span>
        <form onSubmit={handleAddGoal} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 items-end mt-2">
          <div className="sm:col-span-2 lg:col-span-4">
            <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">Goal Name</label>
            <input 
              type="text" 
              required 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. Vacation Fund" 
              className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none focus:border-[2px] dark:focus:border-white font-mono text-xs font-semibold" 
            />
          </div>
          <div className="sm:col-span-1 lg:col-span-2">
            <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">Target (₹)</label>
            <input 
              type="number" 
              required 
              min={1} 
              placeholder="0"
              value={targetAmount || ''} 
              onChange={e => setTargetAmount(Number(e.target.value))} 
              className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none focus:border-[2px] dark:focus:border-white font-mono text-xs font-bold" 
            />
          </div>
          <div className="sm:col-span-1 lg:col-span-2">
            <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">Initial Saved (₹)</label>
            <input 
              type="number" 
              min={0} 
              placeholder="0"
              value={currentAmount || ''} 
              onChange={e => setCurrentAmount(Number(e.target.value))} 
              className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none focus:border-[2px] dark:focus:border-white font-mono text-xs" 
            />
          </div>
          <div className="sm:col-span-1 lg:col-span-2">
            <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">Target Date</label>
            <input 
              type="date" 
              required 
              value={targetDate} 
              onChange={e => setTargetDate(e.target.value)} 
              className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none focus:border-[2px] dark:focus:border-white font-mono text-xs" 
            />
          </div>
          <div className="sm:col-span-1 lg:col-span-2">
            <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">Auto-save/mo (₹)</label>
            <input 
              type="number" 
              min={0} 
              placeholder="Optional"
              value={monthlyContribution || ''} 
              onChange={e => setMonthlyContribution(Number(e.target.value))} 
              className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none focus:border-[2px] dark:focus:border-white font-mono text-xs" 
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-12">
            <button 
              type="submit" 
              className="w-full bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] py-2.5 px-4 font-bold uppercase tracking-widest text-xs hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors active:scale-95 touch-manipulation min-h-[38px] flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#777] dark:shadow-[2px_2px_0px_#000]"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Savings Goal</span>
            </button>
          </div>
        </form>
      </div>

      {/* Goals List */}
      <div className="bg-white dark:bg-[#1A1A1A] border border-[#1A1A1A] dark:border-[#383838] p-4 sm:p-6 md:p-8 shadow-[4px_4px_0px_#1A1A1A] sm:shadow-[8px_8px_0px_#1A1A1A] dark:shadow-[8px_8px_0px_#000]">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold tracking-tight text-[#1A1A1A] dark:text-[#F0ECE1] mb-4 sm:mb-6 border-b-2 border-[#1A1A1A] dark:border-[#383838] pb-2">
          Savings Goals
        </h2>
        
        {loading ? (
          <p className="text-xs font-mono uppercase tracking-widest text-[#666] dark:text-[#A0A0A0] py-4">Loading goals...</p>
        ) : goals.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424]">
            <p className="text-xs font-mono uppercase tracking-widest text-[#666] dark:text-[#A0A0A0]">No goals configured yet. Set a financial milestone above to start tracking.</p>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {goals.map(goal => {
              const rule = recurringRules.find(r => r.id === goal.linked_recurring_rule_id);
              const percent = Math.min(100, (goal.current_amount / goal.target_amount) * 100);
              const isCompleted = goal.current_amount >= goal.target_amount;
              const projection = calculateProjection(goal, rule);

              return (
                <div key={goal.id} className="border border-[#1A1A1A] dark:border-[#383838] p-3.5 sm:p-4 bg-[#FCFAF7] dark:bg-[#242424] shadow-[2px_2px_0px_#1A1A1A] dark:shadow-[2px_2px_0px_#000]">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-baseline mb-2 gap-1">
                    <div className="flex items-center justify-between sm:justify-start gap-2">
                      <span className="font-serif italic text-lg sm:text-xl font-bold text-[#1A1A1A] dark:text-[#F0ECE1]">{goal.name}</span>
                      {isCompleted && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] uppercase font-mono px-1.5 py-0.5 bg-green-100 dark:bg-emerald-950/60 text-green-800 dark:text-emerald-300 font-bold border border-green-300 dark:border-emerald-800">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Reached
                        </span>
                      )}
                      <button 
                        onClick={() => goal.id && handleDelete(goal.id)} 
                        className="sm:hidden text-red-700 dark:text-rose-400 p-1 hover:opacity-70 touch-manipulation"
                        title="Delete goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-baseline justify-between sm:justify-end gap-2 text-right">
                      <span className="font-bold font-mono text-base sm:text-lg text-green-800 dark:text-emerald-400">₹{goal.current_amount.toLocaleString()}</span>
                      <span className="text-xs text-[#666] dark:text-[#A0A0A0] font-mono">/ ₹{goal.target_amount.toLocaleString()} ({Math.round(percent)}%)</span>
                      <button 
                        onClick={() => goal.id && handleDelete(goal.id)} 
                        className="hidden sm:inline-block ml-3 text-[10px] uppercase font-bold text-red-700 dark:text-rose-400 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="w-full bg-[#E5E2DE] dark:bg-[#333] h-3.5 border border-[#1A1A1A] dark:border-[#444] relative mb-3 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${isCompleted ? 'bg-[#2A4B3A] dark:bg-emerald-600' : 'bg-[#1A1A1A] dark:bg-[#E0E0E0]'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between text-[10px] font-mono uppercase tracking-wider text-[#666] dark:text-[#A0A0A0] gap-2 pt-1 border-t border-dotted border-gray-300 dark:border-[#383838]">
                    <div className="space-y-0.5">
                      <p>Target Date: <span className="font-bold text-[#1A1A1A] dark:text-[#F0ECE1]">{goal.target_date}</span></p>
                      {rule && (
                        <p className="text-[#2A4B3A] dark:text-emerald-400 font-bold">
                          Auto-saving ₹{rule.amount.toLocaleString()}/{rule.frequency}
                        </p>
                      )}
                      {projection && projection !== "Completed" && (
                        <p className="text-[#1A1A1A] dark:text-[#F0ECE1]">Projected completion: {projection}</p>
                      )}
                    </div>
                    
                    <div className="self-start sm:self-auto mt-1 sm:mt-0">
                      {contributeGoalId === goal.id ? (
                        <form onSubmit={handleManualContribute} className="flex flex-wrap items-center gap-1.5">
                          <input 
                            type="number" 
                            required 
                            min={1}
                            placeholder="₹ Amount" 
                            value={contributeAmount || ''} 
                            onChange={e => setContributeAmount(Number(e.target.value))}
                            className="w-24 px-2 py-1 border border-[#1A1A1A] dark:border-[#444] bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1] text-xs font-mono font-bold focus:outline-none"
                          />
                          <button type="submit" className="bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] px-2.5 py-1 text-[10px] font-bold uppercase hover:opacity-80 touch-manipulation">Add</button>
                          <button type="button" onClick={() => setContributeGoalId(null)} className="border border-[#1A1A1A] dark:border-[#444] bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1] px-2 py-1 text-[10px] font-bold uppercase hover:bg-gray-100 dark:hover:bg-[#242424] touch-manipulation">Cancel</button>
                        </form>
                      ) : !isCompleted && (
                        <button 
                          onClick={() => setContributeGoalId(goal.id!)}
                          className="border border-[#1A1A1A] dark:border-[#444] bg-white dark:bg-[#1A1A1A] px-2.5 py-1 text-[10px] font-bold uppercase text-[#1A1A1A] dark:text-[#F0ECE1] hover:bg-[#1A1A1A] hover:text-white dark:hover:bg-white dark:hover:text-[#121212] transition-colors touch-manipulation"
                        >
                          + Add Contribution
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
