import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getIncomes,
  addIncome,
  updateIncome,
  deleteIncome,
} from "../lib/db";
import { IncomeEntry } from "../types";
import { parsePayslip } from "../lib/payslipParser";
import {
  PlusCircle,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface EditIncomeState {
  id: string;
  basic: number;
  hra: number;
  special: number;
  bonus: number;
  other: number;
  epf: number;
  pt: number;
  tds: number;
}

export function IncomeSection({ currentMonth }: { currentMonth: string }) {
  const { user } = useAuth();
  const [incomes, setIncomes] = useState<IncomeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(true);

  // Payslip parsing state
  const [parsingPayslip, setParsingPayslip] = useState(false);
  const [payslipStatus, setPayslipStatus] = useState<string | null>(null);
  const [payslipError, setPayslipError] = useState<string | null>(null);

  // Edit modal state
  const [editing, setEditing] = useState<EditIncomeState | null>(null);

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

  const handleParsePayslip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsingPayslip(true);
    setPayslipError(null);
    setPayslipStatus("Reading payslip with AI...");
    setShowForm(true);
    try {
      const parsed = await parsePayslip(file);
      setBasic(parsed.basic);
      setHra(parsed.hra);
      setSpecial(parsed.special_allowance);
      setBonus(parsed.bonus);
      setOther(parsed.other);
      setEpf(parsed.epf_deduction);
      setPt(parsed.professional_tax);
      setTds(parsed.tds);
      // net_credited is computed live from the components in the form
      const periodNote = parsed.month
        ? parsed.month !== currentMonth
          ? ` (period ${parsed.month} detected - saving to ${currentMonth})`
          : ""
        : "";
      setPayslipStatus(
        `Payslip parsed${periodNote}: basic ₹${parsed.basic.toLocaleString()}, take-home ₹${parsed.net_credited.toLocaleString()}. Review and press Record Income.`,
      );
      setTimeout(() => setPayslipStatus(null), 10000);
    } catch (err: any) {
      console.error("Payslip parse failed:", err);
      setPayslipError(
        err.message ||
          "Could not read this payslip. Enter the values manually.",
      );
      setTimeout(() => setPayslipError(null), 10000);
    } finally {
      setParsingPayslip(false);
      e.target.value = "";
    }
  };

  const startEdit = (inc: IncomeEntry) => {
    if (!inc.id) return;
    setEditing({
      id: inc.id,
      basic: inc.basic,
      hra: inc.hra,
      special: inc.special_allowance,
      bonus: inc.bonus,
      other: inc.other,
      epf: inc.epf_deduction,
      pt: inc.professional_tax,
      tds: inc.tds,
    });
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const gross =
      editing.basic + editing.hra + editing.special + editing.bonus + editing.other;
    const ded = editing.epf + editing.pt + editing.tds;
    await updateIncome(editing.id, {
      basic: editing.basic,
      hra: editing.hra,
      special_allowance: editing.special,
      bonus: editing.bonus,
      other: editing.other,
      epf_deduction: editing.epf,
      professional_tax: editing.pt,
      tds: editing.tds,
      net_credited: gross - ded,
    });
    setEditing(null);
    fetchIncomes();
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* Entry Form */}
      <div className="bg-white dark:bg-[#1A1A1A] border border-[#1A1A1A] dark:border-[#383838] p-4 sm:p-6 md:p-8 relative shadow-[3px_3px_0px_#1A1A1A] sm:shadow-[6px_6px_0px_#1A1A1A] dark:shadow-[6px_6px_0px_#000]">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest">
              Add Income
            </span>
            <label
              className={`cursor-pointer text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5 transition-all w-max ${parsingPayslip ? "text-[#666] dark:text-[#999]" : "text-blue-700 dark:text-sky-400 hover:text-blue-900 dark:hover:text-sky-300"}`}
              title="Upload a payslip or Form 16 page - AI extracts salary components"
            >
              {parsingPayslip ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
              <span>{parsingPayslip ? "Parsing..." : "Parse Payslip / Form 16"}</span>
              <input
                type="file"
                accept="image/*,.heic,.heif,image/heic,image/heif,application/pdf"
                capture="environment"
                className="hidden"
                onChange={handleParsePayslip}
                disabled={parsingPayslip}
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="sm:hidden text-[10px] uppercase font-bold tracking-wider underline text-[#1A1A1A] dark:text-[#F0ECE1]"
          >
            {showForm ? "Collapse Form" : "+ Expand Form"}
          </button>
        </div>

        {payslipStatus && (
          <div className="mb-4 p-2.5 bg-[#F0F5F2] dark:bg-emerald-950/40 border border-[#2A4B3A] dark:border-emerald-600 text-[#2A4B3A] dark:text-emerald-300 text-xs font-mono flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{payslipStatus}</span>
            </div>
            <button
              onClick={() => setPayslipStatus(null)}
              className="text-[10px] uppercase hover:underline"
            >
              ✕
            </button>
          </div>
        )}

        {payslipError && (
          <div className="mb-4 p-2.5 bg-[#FDF2F2] dark:bg-rose-950/40 border border-[#8B2626] dark:border-rose-600 text-[#8B2626] dark:text-rose-300 text-xs font-mono flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{payslipError}</span>
            </div>
            <button
              onClick={() => setPayslipError(null)}
              className="text-[10px] uppercase hover:underline"
            >
              ✕
            </button>
          </div>
        )}

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
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEdit(inc)}
                      className="text-[10px] uppercase font-mono font-bold text-blue-700 dark:text-sky-400 hover:opacity-70 p-1.5 touch-manipulation"
                      title="Edit income entry"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => inc.id && handleDelete(inc.id)}
                      className="text-[10px] uppercase font-mono font-bold text-red-700 dark:text-rose-400 hover:opacity-70 p-1.5 touch-manipulation inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
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

      {/* Edit Income Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#FCFAF7] dark:bg-[#1C1C1C] border border-[#1A1A1A] dark:border-[#333] max-w-lg w-full p-5 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#EBE7DF] dark:border-[#2E2E2E] pb-3">
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-[#1A1A1A] dark:text-white">
                Edit Income Entry
              </h3>
              <button
                onClick={() => setEditing(null)}
                className="text-xs font-mono text-[#888] hover:text-black dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSave} className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(
                  [
                    ["Basic", "basic"],
                    ["HRA", "hra"],
                    ["Special Allow.", "special"],
                    ["Bonus", "bonus"],
                    ["Other", "other"],
                    ["EPF", "epf"],
                    ["Prof. Tax", "pt"],
                    ["TDS", "tds"],
                  ] as [string, keyof EditIncomeState][]
                ).map(([label, key]) => (
                  <div key={key}>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                      {label} (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={(editing as any)[key] || ""}
                      onChange={(e) =>
                        setEditing({ ...editing, [key]: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-white dark:bg-[#242424] text-xs font-mono text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center bg-[#F5F2EB] dark:bg-[#202020] p-2.5 border border-[#1A1A1A] dark:border-[#444]">
                <span className="text-[10px] uppercase font-bold tracking-widest">
                  Est. Net Take-Home
                </span>
                <span className="text-sm font-serif font-bold text-green-800 dark:text-emerald-400">
                  ₹
                  {(
                    editing.basic +
                    editing.hra +
                    editing.special +
                    editing.bonus +
                    editing.other -
                    (editing.epf + editing.pt + editing.tds)
                  ).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#EBE7DF] dark:border-[#2E2E2E]">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-3 py-1.5 border border-[#1A1A1A] dark:border-[#444] text-[10px] font-mono uppercase font-bold text-[#666] dark:text-[#AAA]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] text-[10px] font-mono uppercase font-bold tracking-wider hover:opacity-90"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
