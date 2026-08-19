import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getIncomes, addIncome, deleteIncome } from "../lib/db";
import { IncomeEntry } from "../types";
import { PlusCircle, Trash2, ArrowUpRight, ArrowDownRight } from "lucide-react";

export function IncomeSection({ currentMonth }: { currentMonth: string }) {
  const { user } = useAuth();
  const [incomes, setIncomes] = useState<IncomeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(true);

  // Form State
  const [basic, setBasic] = useState<number>(0);
  const [hra, setHra] = useState<number>(0);
  const [special, setSpecial] = useState<number>(0);
  const [bonus, setBonus] = useState<number>(0);
  const [other, setOther] = useState<number>(0);
  const [epf, setEpf] = useState<number>(0);
  const [pt, setPt] = useState<number>(0);
  const [tds, setTds] = useState<number>(0);

  const fetchIncomes = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getIncomes(user.uid, currentMonth);
      setIncomes(data || []);
    } catch (e) {
      console.warn("Notice loading incomes:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, [user, currentMonth]);

  const grossEarnings = basic + hra + special + bonus + other;
  const totalDeductions = epf + pt + tds;
  const calculatedNet = grossEarnings - totalDeductions;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || grossEarnings <= 0) return;

    await addIncome({
      user_id: user.uid,
      month: currentMonth,
      basic,
      hra,
      special_allowance: special,
      bonus,
      other,
      epf_deduction: epf,
      professional_tax: pt,
      tds,
      net_credited: calculatedNet,
    });

    // Reset
    setBasic(0);
    setHra(0);
    setSpecial(0);
    setBonus(0);
    setOther(0);
    setEpf(0);
    setPt(0);
    setTds(0);
    fetchIncomes();
  };

  const handleDelete = async (id: string) => {
    await deleteIncome(id);
    fetchIncomes();
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* Entry Form */}
      <div className="bg-white dark:bg-[#1A1A1A] border border-[#1A1A1A] dark:border-[#383838] p-4 sm:p-6 md:p-8 relative shadow-[3px_3px_0px_#1A1A1A] sm:shadow-[6px_6px_0px_#1A1A1A] dark:shadow-[6px_6px_0px_#000]">
        <div className="flex justify-between items-center mb-4">
          <span className="bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest">
            Add Income
          </span>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="sm:hidden text-[10px] uppercase font-bold tracking-wider underline text-[#1A1A1A] dark:text-[#F0ECE1]"
          >
            {showForm ? "Collapse Form" : "+ Expand Form"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Earnings Column */}
              <div className="space-y-3.5 border-b md:border-b-0 md:border-r border-[#1A1A1A] dark:border-[#383838] border-dotted pb-6 md:pb-0 md:pr-6">
                <div className="flex items-center justify-between border-b border-[#1A1A1A] dark:border-[#383838] pb-1">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-green-800 dark:text-emerald-400 flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" /> Earnings
                  </p>
                  <span className="text-xs font-mono font-bold text-green-700 dark:text-emerald-400">
                    ₹{grossEarnings.toLocaleString()}
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                    Basic Salary (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={basic || ""}
                    onChange={(e) => setBasic(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none focus:border-[2px] dark:focus:border-white font-mono text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                    HRA (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={hra || ""}
                    onChange={(e) => setHra(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none focus:border-[2px] dark:focus:border-white font-mono text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                    Special Allowance (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={special || ""}
                    onChange={(e) => setSpecial(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none focus:border-[2px] dark:focus:border-white font-mono text-xs font-semibold"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                      Bonus (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={bonus || ""}
                      onChange={(e) => setBonus(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none focus:border-[2px] dark:focus:border-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                      Other (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={other || ""}
                      onChange={(e) => setOther(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none focus:border-[2px] dark:focus:border-white font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Deductions Column */}
              <div className="space-y-3.5 flex flex-col justify-between">
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between border-b border-[#1A1A1A] dark:border-[#383838] pb-1">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-red-700 dark:text-rose-400 flex items-center gap-1">
                      <ArrowDownRight className="w-3 h-3" /> Deductions
                    </p>
                    <span className="text-xs font-mono font-bold text-red-700 dark:text-rose-400">
                      -₹{totalDeductions.toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                      EPF (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={epf || ""}
                      onChange={(e) => setEpf(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-red-700 dark:border-rose-500 bg-[#FCFAF7] dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none focus:border-[2px] dark:focus:border-rose-400 font-mono text-xs text-red-700 dark:text-rose-400 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                      Professional Tax (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={pt || ""}
                      onChange={(e) => setPt(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-red-700 dark:border-rose-500 bg-[#FCFAF7] dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none focus:border-[2px] dark:focus:border-rose-400 font-mono text-xs text-red-700 dark:text-rose-400 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                      TDS (Estimate) (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={tds || ""}
                      onChange={(e) => setTds(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-red-700 dark:border-rose-500 bg-[#FCFAF7] dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none focus:border-[2px] dark:focus:border-rose-400 font-mono text-xs text-red-700 dark:text-rose-400 font-semibold"
                    />
                  </div>
                </div>

                {/* Net Summary & Action */}
                <div className="pt-4 border-t border-gray-200 dark:border-[#383838]">
                  <div className="flex justify-between items-center mb-3 bg-[#FCFAF7] dark:bg-[#242424] p-2.5 border border-[#1A1A1A] dark:border-[#444]">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0]">
                      Est. Net Take-Home
                    </span>
                    <span className="text-base font-serif font-bold text-green-800 dark:text-emerald-400">
                      ₹{calculatedNet.toLocaleString()}
                    </span>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] py-3 font-bold uppercase tracking-widest text-xs hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors active:scale-95 touch-manipulation flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#777] dark:shadow-[2px_2px_0px_#000]"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Record Income</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* List View */}
      <div className="bg-white dark:bg-[#1A1A1A] border border-[#1A1A1A] dark:border-[#383838] shadow-[4px_4px_0px_#1A1A1A] sm:shadow-[8px_8px_0px_#1A1A1A] dark:shadow-[8px_8px_0px_#000] p-4 sm:p-6 md:p-8">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold tracking-tight text-[#1A1A1A] dark:text-[#F0ECE1] mb-4 sm:mb-6 border-b-2 border-[#1A1A1A] dark:border-[#383838] pb-2">
          Income Entries ({currentMonth})
        </h2>
        {loading ? (
          <p className="text-xs font-mono uppercase tracking-widest text-[#666] dark:text-[#A0A0A0] py-4">
            Loading income...
          </p>
        ) : incomes.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424]">
            <p className="text-xs font-mono uppercase tracking-widest text-[#666] dark:text-[#A0A0A0]">
              No income logged for this month.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {incomes.map((inc) => (
              <div
                key={inc.id}
                className="border border-[#1A1A1A] dark:border-[#383838] p-3 sm:p-4 bg-[#FCFAF7] dark:bg-[#242424] shadow-[2px_2px_0px_#1A1A1A] dark:shadow-[2px_2px_0px_#000]"
              >
                <div className="flex justify-between items-start mb-3 border-b border-gray-300 dark:border-[#383838] pb-2">
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-[#666] dark:text-[#A0A0A0]">
                      Net Credited
                    </p>
                    <p className="text-xl sm:text-2xl font-serif font-bold text-green-800 dark:text-emerald-400">
                      ₹{inc.net_credited.toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => inc.id && handleDelete(inc.id)}
                    className="text-[10px] uppercase font-mono font-bold text-red-700 dark:text-rose-400 hover:opacity-70 p-1.5 touch-manipulation inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-xs font-mono">
                  <div className="bg-white dark:bg-[#1A1A1A] p-2 border border-gray-200 dark:border-[#383838]">
                    <span className="text-[9px] text-[#666] dark:text-[#A0A0A0] block uppercase">
                      Basic
                    </span>
                    <span className="font-semibold text-[#1A1A1A] dark:text-[#F0ECE1]">
                      ₹{inc.basic.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-[#1A1A1A] p-2 border border-gray-200 dark:border-[#383838]">
                    <span className="text-[9px] text-[#666] dark:text-[#A0A0A0] block uppercase">
                      HRA
                    </span>
                    <span className="font-semibold text-[#1A1A1A] dark:text-[#F0ECE1]">
                      ₹{inc.hra.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-[#1A1A1A] p-2 border border-gray-200 dark:border-[#383838]">
                    <span className="text-[9px] text-[#666] dark:text-[#A0A0A0] block uppercase">
                      Special
                    </span>
                    <span className="font-semibold text-[#1A1A1A] dark:text-[#F0ECE1]">
                      ₹{inc.special_allowance.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-[#1A1A1A] p-2 border border-red-200 dark:border-rose-900/50 text-red-700 dark:text-rose-400">
                    <span className="text-[9px] block uppercase">
                      Deductions
                    </span>
                    <span className="font-semibold">
                      -₹
                      {(
                        inc.epf_deduction +
                        inc.professional_tax +
                        inc.tds
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
