import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getRecurringRules,
  addRecurringRule,
  deleteRecurringRule,
  processRecurringRules,
  getCategories,
  addCategory,
} from "../lib/db";
import { RecurringRule, Category } from "../types";
import { Play, PlusCircle, Trash2, CalendarClock, Tag } from "lucide-react";

export function RecurringSection() {
  const { user } = useAuth();
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Form State
  const [categoryId, setCategoryId] = useState<string>("");
  const [customCategory, setCustomCategory] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [frequency, setFrequency] = useState<
    "monthly" | "quarterly" | "yearly"
  >("monthly");
  const [nextDueDate, setNextDueDate] = useState<string>("");
  const [label, setLabel] = useState<string>("");

  const fetchData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [ruleData, catData] = await Promise.all([
        getRecurringRules(user.uid),
        getCategories(user.uid),
      ]);

      setRules(ruleData || []);
      setCategories(catData || []);
      if (catData && catData.length > 0 && !categoryId) {
        setCategoryId(catData[0].name);
      }

      if (!nextDueDate) {
        setNextDueDate(new Date().toISOString().split("T")[0]);
      }
    } catch (e) {
      console.warn("Notice loading recurring rules:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !categoryId || amount <= 0) return;

    let finalCategory = categoryId;
    if (categoryId === "__OTHER__") {
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

    await addRecurringRule({
      user_id: user.uid,
      category_id: finalCategory,
      amount,
      frequency,
      next_due_date: nextDueDate,
      label,
      active: true,
    });

    setAmount(0);
    setLabel("");
    setCustomCategory("");
    if (categoryId === "__OTHER__") {
      setCategoryId(finalCategory);
    }
    fetchData();
  };

  const handleProcess = async () => {
    if (!user) return;
    if (window.confirm("Check and process all due recurring transactions?")) {
      setProcessing(true);
      const count = await processRecurringRules(user.uid);
      alert(`Processed ${count} transaction(s).`);
      setProcessing(false);
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this recurring rule?")) {
      await deleteRecurringRule(id);
      fetchData();
    }
  };

  const isOtherCategory = categoryId === "__OTHER__";

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* Add Rule Form */}
      <div className="bg-white dark:bg-[#1A1A1A] border border-[#1A1A1A] dark:border-[#383838] p-4 sm:p-6 md:p-8 relative shadow-[3px_3px_0px_#1A1A1A] sm:shadow-[6px_6px_0px_#1A1A1A] dark:shadow-[6px_6px_0px_#000]">
        <span className="absolute -top-3 left-4 bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest">
          New Recurring Rule
        </span>
        <form onSubmit={handleAddRule} className="space-y-3 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 items-end">
            <div className="sm:col-span-1 lg:col-span-3">
              <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                Category
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
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
            <div className="sm:col-span-1 lg:col-span-3">
              <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                Label / Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Netflix, Rent, Broadband"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none focus:border-[2px] dark:focus:border-white font-mono text-xs"
              />
            </div>
            <div className="sm:col-span-1 lg:col-span-2">
              <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="0"
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none focus:border-[2px] dark:focus:border-white font-mono text-xs font-bold"
              />
            </div>
            <div className="sm:col-span-1 lg:col-span-2">
              <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none focus:border-[2px] dark:focus:border-white font-mono text-xs uppercase"
              >
                <option
                  value="monthly"
                  className="bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1]"
                >
                  Monthly
                </option>
                <option
                  value="quarterly"
                  className="bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1]"
                >
                  Quarterly
                </option>
                <option
                  value="yearly"
                  className="bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1]"
                >
                  Yearly
                </option>
              </select>
            </div>
            <div className="sm:col-span-1 lg:col-span-2">
              <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                Next Due Date
              </label>
              <input
                type="date"
                required
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none focus:border-[2px] dark:focus:border-white font-mono text-xs"
              />
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
                placeholder="e.g. Subscriptions, Memberships, Maintenance, Utilities"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#555] bg-white dark:bg-[#181818] text-[#1A1A1A] dark:text-[#F0ECE1] font-mono text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              />
            </div>
          )}

          <div>
            <button
              type="submit"
              className="w-full bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] py-2.5 px-4 font-bold uppercase tracking-widest text-xs hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors active:scale-95 touch-manipulation min-h-[38px] flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#777] dark:shadow-[2px_2px_0px_#000]"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Recurring Rule</span>
            </button>
          </div>
        </form>
      </div>

      {/* List View */}
      <div className="bg-white dark:bg-[#1A1A1A] border border-[#1A1A1A] dark:border-[#383838] p-4 sm:p-6 md:p-8 shadow-[4px_4px_0px_#1A1A1A] sm:shadow-[8px_8px_0px_#1A1A1A] dark:shadow-[8px_8px_0px_#000]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 border-b-2 border-[#1A1A1A] dark:border-[#383838] pb-3 gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-[#1A1A1A] dark:text-[#F0ECE1]">
              Active Recurring Rules
            </h2>
            <p className="text-[10px] uppercase font-mono text-[#666] dark:text-[#A0A0A0] tracking-wider mt-0.5">
              Automate repeated expenses and bill debits
            </p>
          </div>
          <button
            onClick={handleProcess}
            disabled={processing}
            className="w-full sm:w-auto bg-[#2A4B3A] dark:bg-emerald-700 text-white px-3 sm:px-4 py-2 text-[10px] uppercase font-bold tracking-widest hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-1.5 touch-manipulation shadow-[2px_2px_0px_#1A1A1A] dark:shadow-[2px_2px_0px_#000]"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>{processing ? "Processing..." : "Run Pending Rules"}</span>
          </button>
        </div>

        {loading ? (
          <p className="text-xs font-mono uppercase tracking-widest text-[#666] dark:text-[#A0A0A0] py-4">
            Loading rules...
          </p>
        ) : rules.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424]">
            <p className="text-xs font-mono uppercase tracking-widest text-[#666] dark:text-[#A0A0A0]">
              No recurring rules configured yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="border border-[#1A1A1A] dark:border-[#383838] p-3 sm:p-3.5 bg-[#FCFAF7] dark:bg-[#242424] flex flex-col sm:flex-row justify-between sm:items-center gap-2 shadow-[2px_2px_0px_#1A1A1A] dark:shadow-[2px_2px_0px_#000]"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif italic font-bold text-sm sm:text-base text-[#1A1A1A] dark:text-[#F0ECE1]">
                      {rule.label || rule.category_id}
                    </span>
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1] border border-[#1A1A1A] dark:border-[#444]">
                      {rule.category_id}
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-[#666] dark:text-[#A0A0A0] uppercase mt-0.5 inline-flex items-center gap-1">
                    <CalendarClock className="w-3 h-3 text-[#1A1A1A] dark:text-[#A0A0A0]" />
                    <span>
                      Next Due: {rule.next_due_date} • {rule.frequency}
                    </span>
                  </p>
                </div>
                <div className="flex justify-between sm:justify-end items-center gap-3 border-t sm:border-t-0 border-gray-300 dark:border-[#383838] pt-2 sm:pt-0">
                  <span className="font-mono text-sm sm:text-base font-bold text-red-700 dark:text-rose-400">
                    ₹{rule.amount.toLocaleString()}
                  </span>
                  <button
                    onClick={() => rule.id && handleDelete(rule.id)}
                    className="text-[10px] uppercase font-bold tracking-widest text-red-700 dark:text-rose-400 hover:opacity-75 inline-flex items-center gap-1 border border-red-700 dark:border-rose-500 bg-white dark:bg-[#1A1A1A] px-2 py-1 touch-manipulation"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
