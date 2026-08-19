import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getBudgets,
  setBudget,
  getTransactions,
  getCategories,
  addCategory,
  cloneBudgets,
} from "../lib/db";
import { Budget, Category, Transaction } from "../types";
import { Copy, PlusCircle, AlertCircle, Tag } from "lucide-react";

export function BudgetSection({ currentMonth }: { currentMonth: string }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [customCategory, setCustomCategory] = useState<string>("");
  const [limitAmount, setLimitAmount] = useState<number>(0);

  const fetchData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [catData, budData, txData] = await Promise.all([
        getCategories(user.uid),
        getBudgets(user.uid, currentMonth),
        getTransactions(user.uid, currentMonth),
      ]);

      setCategories(catData || []);
      setBudgets(budData || []);
      setTransactions(txData || []);

      if (catData && catData.length > 0 && !selectedCategory) {
        setSelectedCategory(catData[0].name);
      }
    } catch (e) {
      console.warn("Notice loading budgets:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, currentMonth]);

  const handleSetBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedCategory) return;

    let finalCategory = selectedCategory;
    if (selectedCategory === "__OTHER__") {
      finalCategory = customCategory.trim() || "Other";
      if (
        customCategory.trim() &&
        !categories.some(
          (c) => c.name.toLowerCase() === customCategory.trim().toLowerCase(),
        )
      ) {
        await addCategory({
          name: customCategory.trim(),
          type: "custom",
          is_default: false,
          user_id: user.uid,
        });
      }
    }

    await setBudget({
      user_id: user.uid,
      category_id: finalCategory,
      month: currentMonth,
      limit_amount: limitAmount,
    });

    setLimitAmount(0);
    setCustomCategory("");
    if (selectedCategory === "__OTHER__") {
      setSelectedCategory(finalCategory);
    }
    fetchData();
  };

  const handleClone = async () => {
    if (!user) return;
    const [year, month] = currentMonth.split("-").map(Number);
    const d = new Date(year, month - 1, 1);
    d.setMonth(d.getMonth() - 1);
    const prevMonth = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;

    if (window.confirm(`Clone budgets from ${prevMonth} to ${currentMonth}?`)) {
      await cloneBudgets(user.uid, prevMonth, currentMonth);
      fetchData();
    }
  };

  // Combine category, budget limit, and spent amount
  const budgetViewData = categories
    .map((cat) => {
      const budget = budgets.find((b) => b.category_id === cat.name);
      const spent = transactions
        .filter((t) => t.category_id === cat.name)
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        category: cat.name,
        limit: budget ? budget.limit_amount : 0,
        spent: spent,
      };
    })
    .filter((b) => b.limit > 0 || b.spent > 0);

  const isOtherCategory = selectedCategory === "__OTHER__";

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* Set Budget Form */}
      <div className="bg-white dark:bg-[#1A1A1A] border border-[#1A1A1A] dark:border-[#383838] p-4 sm:p-6 md:p-8 relative shadow-[3px_3px_0px_#1A1A1A] sm:shadow-[6px_6px_0px_#1A1A1A] dark:shadow-[6px_6px_0px_#000]">
        <span className="absolute -top-3 left-4 bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest">
          Set Category Limit
        </span>
        <form onSubmit={handleSetBudget} className="space-y-3 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-end">
            <div className="sm:col-span-5">
              <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                Category
              </label>
              <select
                required
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none focus:border-[2px] dark:focus:border-white font-mono text-xs uppercase"
              >
                {categories.map((c) => (
                  <option
                    key={c.id || c.name}
                    value={c.name}
                    className="bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1]"
                  >
                    {c.name}
                  </option>
                ))}
                <option
                  value="__OTHER__"
                  className="bg-white dark:bg-[#1A1A1A] text-amber-700 dark:text-amber-400 font-bold"
                >
                  + Other (Specify Custom Category)...
                </option>
              </select>
            </div>
            <div className="sm:col-span-4">
              <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                Monthly Limit (₹)
              </label>
              <input
                type="number"
                required
                min="0"
                placeholder="0"
                value={limitAmount || ""}
                onChange={(e) => setLimitAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none focus:border-[2px] dark:focus:border-white font-mono text-xs font-semibold"
              />
            </div>
            <div className="sm:col-span-3">
              <button
                type="submit"
                className="w-full bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] py-2.5 px-4 font-bold uppercase tracking-widest text-xs hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors active:scale-95 touch-manipulation min-h-[38px] flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#777] dark:shadow-[2px_2px_0px_#000]"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Save Limit</span>
              </button>
            </div>
          </div>

          {/* Conditional "Other" Input Field */}
          {isOtherCategory && (
            <div className="p-3 bg-[#F5F2EB] dark:bg-[#202020] border border-[#1A1A1A] dark:border-[#444] animate-in fade-in duration-200">
              <label className="block text-[10px] uppercase font-bold tracking-widest text-amber-800 dark:text-amber-300 mb-1 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                <span>Custom Category Name / Description *</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Pet Care, Fitness / Gym, Hobbies, Home Improvement"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#555] bg-white dark:bg-[#181818] text-[#1A1A1A] dark:text-[#F0ECE1] font-mono text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              />
            </div>
          )}
        </form>
      </div>

      {/* Allocation Strategy */}
      <div className="border border-[#1A1A1A] dark:border-[#383838] p-4 sm:p-6 md:p-8 bg-white dark:bg-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] sm:shadow-[8px_8px_0px_#1A1A1A] dark:shadow-[8px_8px_0px_#000]">
        <div className="flex flex-col sm:flex-row justify-between sm:items-baseline border-b-2 border-[#1A1A1A] dark:border-[#383838] pb-3 mb-6 gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-[#1A1A1A] dark:text-[#F0ECE1]">
              Monthly Budgets ({currentMonth})
            </h2>
            <p className="text-[10px] uppercase tracking-widest text-[#666] dark:text-[#A0A0A0] mt-0.5">
              Category allocation & spend progress
            </p>
          </div>
          <button
            onClick={handleClone}
            className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] hover:opacity-70 border-b border-[#1A1A1A] dark:border-[#777] pb-0.5 self-start sm:self-auto inline-flex items-center gap-1 touch-manipulation"
          >
            <Copy className="w-3 h-3" />
            <span>Clone Prev Month</span>
          </button>
        </div>

        {loading ? (
          <p className="text-xs font-mono uppercase tracking-widest text-[#666] dark:text-[#A0A0A0] py-4">
            Loading budgets...
          </p>
        ) : budgetViewData.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424]">
            <p className="text-xs font-mono uppercase tracking-widest text-[#666] dark:text-[#A0A0A0]">
              No budgets set for this month. Use the form above to add limits.
            </p>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-7">
            {budgetViewData.map((item) => {
              const isOver = item.spent > item.limit && item.limit > 0;
              const percent =
                item.limit > 0
                  ? Math.min(100, (item.spent / item.limit) * 100)
                  : 100;

              return (
                <div key={item.category} className="space-y-1.5">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="font-serif italic text-base sm:text-lg font-semibold truncate text-[#1A1A1A] dark:text-[#F0ECE1]">
                      {item.category}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {isOver && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] uppercase font-mono px-1.5 py-0.5 bg-red-100 dark:bg-rose-950/60 text-red-700 dark:text-rose-300 font-bold border border-red-300 dark:border-rose-800">
                          <AlertCircle className="w-2.5 h-2.5" /> Exceeded
                        </span>
                      )}
                      <span
                        className={`font-mono text-xs sm:text-sm font-bold ${isOver ? "text-red-700 dark:text-rose-400" : "text-[#1A1A1A] dark:text-[#F0ECE1]"}`}
                      >
                        ₹{item.spent.toLocaleString()}
                        {item.limit > 0 && (
                          <span className="text-xs text-[#888] dark:text-[#999] font-normal ml-1">
                            / ₹{item.limit.toLocaleString()} (
                            {Math.round(percent)}%)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-[#E5E2DE] dark:bg-[#333] h-3 overflow-hidden">
                    <div
                      className={`h-3 transition-all duration-300 ${isOver ? "bg-red-700 dark:bg-rose-500" : percent > 80 ? "bg-amber-600 dark:bg-amber-400" : "bg-[#1A1A1A] dark:bg-[#E0E0E0]"}`}
                      style={{
                        width: `${item.limit === 0 ? (item.spent > 0 ? 100 : 0) : percent}%`,
                      }}
                    ></div>
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
