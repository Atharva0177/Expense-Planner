import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getTransactions, addTransaction, deleteTransaction, getCategories, addCategory } from "../lib/db";
import { Transaction, Category } from "../types";
import { PlusCircle, Trash2, Tag, Calendar as CalendarIcon, Camera, Loader2, Edit3, CreditCard, CheckCircle2, AlertTriangle, Key, X } from "lucide-react";
import { processImageForOCR, isHeicFile } from "../lib/imageUtils";
import { scanReceiptWithFallback } from "../lib/receiptScanner";

export function ExpenseSection({ currentMonth }: { currentMonth: string }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => {
    return (typeof window !== "undefined" ? localStorage.getItem("expense_planner_gemini_key") : "") || "";
  });

  // Form State
  const [amount, setAmount] = useState<number>(0);
  const [categoryId, setCategoryId] = useState<string>("");
  const [customCategory, setCustomCategory] = useState<string>("");
  const [date, setDate] = useState<string>(`${currentMonth}-01`);
  const [note, setNote] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<string>("UPI");
  const [customPaymentMode, setCustomPaymentMode] = useState<string>("");

  const fetchData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [txData, catData] = await Promise.all([
        getTransactions(user.uid, currentMonth),
        getCategories(user.uid)
      ]);
      setTransactions(txData || []);
      setCategories(catData || []);
      if (catData && catData.length > 0 && !categoryId) {
        setCategoryId(catData[0].name);
      }
    } catch (e) {
      console.warn("Notice loading expenses:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setDate(`${currentMonth}-01`);
  }, [user, currentMonth]);

  const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setShowForm(true);
    setScanError(null);
    setScanStatus(isHeicFile(file) ? "Converting HEIC photo and analyzing receipt..." : "Analyzing receipt image with Gemini...");
    
    try {
      // Process image (converts .heic/.heif to JPEG, resizes if huge)
      const { imageBase64, mimeType } = await processImageForOCR(file);

      const data = await scanReceiptWithFallback(imageBase64, mimeType);
      let detectedDetails: string[] = [];
      
      if (data.amount && Number(data.amount) > 0) {
        setAmount(Number(data.amount));
        detectedDetails.push(`₹${data.amount}`);
      }
      if (data.date) {
        setDate(data.date);
        detectedDetails.push(data.date);
      }
      if (data.merchant) {
        setNote(data.merchant);
        detectedDetails.push(data.merchant);
      }
      
      if (data.category) {
        const matchedCategory = categories.find(c => c.name.toLowerCase() === data.category.toLowerCase());
        if (matchedCategory) {
          setCategoryId(matchedCategory.name);
          detectedDetails.push(matchedCategory.name);
        } else {
          setCategoryId("__OTHER__");
          setCustomCategory(data.category);
          detectedDetails.push(`Category: ${data.category}`);
        }
      }

      setScanStatus(`Receipt parsed successfully: ${detectedDetails.join(" • ")}`);
      setTimeout(() => setScanStatus(null), 6000);
    } catch (err: any) {
      console.error("Receipt scan failed:", err);
      setScanError(err.message || "Failed to analyze receipt. Please try another image or enter manually.");
      setTimeout(() => setScanError(null), 8000);
    } finally {
      setScanning(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || amount <= 0) return;
    
    let finalCategory = categoryId;
    if (categoryId === "__OTHER__") {
      finalCategory = customCategory.trim() || "Other";
      if (customCategory.trim() && !categories.some(c => c.name.toLowerCase() === customCategory.trim().toLowerCase())) {
        await addCategory({
          name: customCategory.trim(),
          type: "custom",
          is_default: false,
          user_id: user.uid
        });
      }
    }

    let finalPaymentMode = paymentMode;
    if (paymentMode === "__OTHER__") {
      finalPaymentMode = customPaymentMode.trim() || "Other";
    }

    await addTransaction({
      user_id: user.uid,
      category_id: finalCategory,
      amount,
      date,
      note,
      payment_mode: finalPaymentMode as any,
      source: "manual"
    });
    
    setAmount(0); 
    setNote(""); 
    if (categoryId === "__OTHER__") {
      setCustomCategory("");
      setCategoryId(finalCategory);
    }
    if (paymentMode === "__OTHER__") {
      setCustomPaymentMode("");
      setPaymentMode("UPI");
    }
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await deleteTransaction(id);
    fetchData();
  };

  const totalExpense = transactions.reduce((sum, t) => sum + t.amount, 0);

  const isOtherCategory = categoryId === "__OTHER__";
  const isOtherPaymentMode = paymentMode === "__OTHER__";

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* Entry Form */}
      <div className="bg-white dark:bg-[#1A1A1A] border border-[#1A1A1A] dark:border-[#383838] p-4 sm:p-6 md:p-8 relative shadow-[3px_3px_0px_#1A1A1A] sm:shadow-[6px_6px_0px_#1A1A1A] dark:shadow-[6px_6px_0px_#000]">
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <span className="bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest inline-block w-max">
              Log Expense
            </span>
            <label className={`cursor-pointer text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5 transition-all w-max ${scanning ? 'text-[#666] dark:text-[#999]' : 'text-blue-700 dark:text-sky-400 hover:text-blue-900 dark:hover:text-sky-300'}`}>
              {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              <span>{scanning ? "Processing..." : "Scan Receipt (JPG, PNG, HEIC)"}</span>
              <input 
                type="file" 
                accept="image/*,.heic,.heif,image/heic,image/heif" 
                capture="environment" 
                className="hidden" 
                onChange={handleScanReceipt} 
                disabled={scanning}
              />
            </label>
            <button
              type="button"
              onClick={() => setShowApiKeyModal(true)}
              title="Configure Gemini API Key"
              className="text-[10px] uppercase font-mono tracking-wider text-[#666] dark:text-[#AAA] hover:text-[#1A1A1A] dark:hover:text-white flex items-center gap-1"
            >
              <Key className="w-3 h-3" />
              <span className="hidden md:inline">API Key</span>
            </button>
          </div>
          <button 
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="sm:hidden text-[10px] uppercase font-bold tracking-wider underline text-[#1A1A1A] dark:text-[#F0ECE1]"
          >
            {showForm ? "Collapse Form" : "+ Expand Form"}
          </button>
        </div>

        {/* Scan Status Banner */}
        {scanStatus && (
          <div className="mb-3 p-2.5 bg-[#F0F5F2] dark:bg-emerald-950/40 border border-[#2A4B3A] dark:border-emerald-600 text-[#2A4B3A] dark:text-emerald-300 text-xs font-mono flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{scanStatus}</span>
            </div>
            <button onClick={() => setScanStatus(null)} className="text-[10px] uppercase hover:underline">✕</button>
          </div>
        )}

        {/* Scan Error Banner */}
        {scanError && (
          <div className="mb-3 p-3 bg-[#FDF2F2] dark:bg-rose-950/40 border border-[#8B2626] dark:border-rose-600 text-[#8B2626] dark:text-rose-300 text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-start sm:items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0" />
              <span>{scanError}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={() => setShowApiKeyModal(true)} 
                className="px-2 py-1 bg-[#8B2626] text-white hover:bg-[#6b1e1e] text-[10px] uppercase font-bold tracking-wider flex items-center gap-1"
              >
                <Key className="w-3 h-3" />
                <span>Enter Gemini Key</span>
              </button>
              <button onClick={() => setScanError(null)} className="text-[10px] uppercase hover:underline">✕</button>
            </div>
          </div>
        )}

        {/* API Key Configuration Modal for Cloudflare / Static Hosting */}
        {showApiKeyModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-[#FCFAF7] dark:bg-[#1C1C1C] border border-[#1A1A1A] dark:border-[#333] max-w-md w-full p-5 space-y-4 shadow-xl">
              <div className="flex justify-between items-center border-b border-[#EBE7DF] dark:border-[#2E2E2E] pb-3">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                  <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-[#1A1A1A] dark:text-white">
                    Configure Gemini API Key
                  </h3>
                </div>
                <button onClick={() => setShowApiKeyModal(false)} className="text-xs font-mono text-[#888] hover:text-black dark:hover:text-white">✕</button>
              </div>

              <p className="text-xs font-mono text-[#555] dark:text-[#AAA] leading-relaxed">
                For Cloudflare Pages and static hosting, receipt scanning can run directly in your browser with your Gemini API key.
              </p>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0]">
                  Google Gemini API Key
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-white dark:bg-[#242424] text-xs font-mono text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none"
                />
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-600 dark:text-sky-400 hover:underline inline-block font-mono mt-1"
                >
                  → Get free API key from Google AI Studio
                </a>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#EBE7DF] dark:border-[#2E2E2E]">
                <button
                  type="button"
                  onClick={() => setShowApiKeyModal(false)}
                  className="px-3 py-1.5 border border-[#1A1A1A] dark:border-[#444] text-[10px] font-mono uppercase font-bold text-[#666] dark:text-[#AAA]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (apiKeyInput.trim()) {
                      localStorage.setItem("expense_planner_gemini_key", apiKeyInput.trim());
                      setScanError(null);
                      setScanStatus("API Key saved! You can now scan receipts.");
                      setShowApiKeyModal(false);
                      setTimeout(() => setScanStatus(null), 5000);
                    } else {
                      localStorage.removeItem("expense_planner_gemini_key");
                      setShowApiKeyModal(false);
                    }
                  }}
                  className="px-3 py-1.5 bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] text-[10px] font-mono uppercase font-bold tracking-wider hover:opacity-90"
                >
                  Save Key
                </button>
              </div>
            </div>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 relative">
            {scanning && (
              <div className="absolute inset-0 bg-white/80 dark:bg-black/80 z-10 flex flex-col items-center justify-center gap-2 p-4 text-center">
                <span className="bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] px-4 py-2 text-xs font-mono font-bold uppercase tracking-widest flex items-center gap-2 shadow-md">
                  <Loader2 className="w-4 h-4 animate-spin" /> {scanStatus || "Analyzing Receipt Image..."}
                </span>
                <p className="text-[10px] font-mono text-[#666] dark:text-[#AAA]">Converting format, extracting total amount, date, and vendor details</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 items-end">
              <div className="sm:col-span-1 lg:col-span-2">
                <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">Date</label>
                <input 
                  type="date" 
                  required 
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none focus:border-[2px] dark:focus:border-white font-mono text-xs" 
                />
              </div>
              
              <div className="sm:col-span-1 lg:col-span-3">
                <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">Category</label>
                <select 
                  required 
                  value={categoryId} 
                  onChange={e => setCategoryId(e.target.value)} 
                  className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none focus:border-[2px] dark:focus:border-white font-mono text-xs uppercase"
                >
                  {categories.map(c => (
                    <option key={c.id || c.name} value={c.name} className="bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1]">{c.name}</option>
                  ))}
                  <option value="__OTHER__" className="bg-white dark:bg-[#1A1A1A] text-amber-700 dark:text-amber-400 font-bold">
                    + Other (Specify Custom Category)...
                  </option>
                </select>
              </div>

              <div className="sm:col-span-1 lg:col-span-2">
                <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">Amount (₹)</label>
                <input 
                  type="number" 
                  required 
                  min="1" 
                  placeholder="0"
                  value={amount || ''} 
                  onChange={e => setAmount(Number(e.target.value))} 
                  className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none focus:border-[2px] dark:focus:border-white font-mono text-xs font-bold" 
                />
              </div>

              <div className="sm:col-span-1 lg:col-span-3">
                <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">Mode & Note</label>
                <div className="flex border border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] focus-within:border-[2px] dark:focus-within:border-white">
                  <select 
                    value={paymentMode} 
                    onChange={e => setPaymentMode(e.target.value)} 
                    className="bg-transparent border-r border-[#1A1A1A] dark:border-[#444] px-2 py-2 font-mono text-[10px] uppercase outline-none shrink-0 text-[#1A1A1A] dark:text-[#F0ECE1]"
                  >
                    <option value="UPI" className="bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1]">UPI</option>
                    <option value="Card" className="bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1]">Card</option>
                    <option value="Cash" className="bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1]">Cash</option>
                    <option value="Netbanking" className="bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1]">NetB</option>
                    <option value="__OTHER__" className="bg-white dark:bg-[#1A1A1A] text-amber-700 dark:text-amber-400 font-bold">Other...</option>
                  </select>
                  <input 
                    type="text" 
                    placeholder="Note (optional)" 
                    value={note} 
                    onChange={e => setNote(e.target.value)} 
                    className="w-full px-2 py-2 bg-transparent focus:outline-none font-mono text-xs min-w-0 text-[#1A1A1A] dark:text-[#F0ECE1]" 
                  />
                </div>
              </div>

              <div className="sm:col-span-2 lg:col-span-2">
                <button 
                  type="submit" 
                  className="w-full bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] py-2.5 px-4 font-bold uppercase tracking-widest text-xs hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors active:scale-95 touch-manipulation min-h-[38px] flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#777] dark:shadow-[2px_2px_0px_#000]"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Conditional "Other" Input Fields */}
            {(isOtherCategory || isOtherPaymentMode) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#F5F2EB] dark:bg-[#202020] border border-[#1A1A1A] dark:border-[#444] animate-in fade-in duration-200">
                {isOtherCategory && (
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-amber-800 dark:text-amber-300 mb-1 flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      <span>Custom Category Name / Description *</span>
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Pet Care, Gym, Home Improvement, Freelance"
                      value={customCategory}
                      onChange={e => setCustomCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#555] bg-white dark:bg-[#181818] text-[#1A1A1A] dark:text-[#F0ECE1] font-mono text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                    />
                  </div>
                )}
                {isOtherPaymentMode && (
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-amber-800 dark:text-amber-300 mb-1 flex items-center gap-1">
                      <CreditCard className="w-3 h-3" />
                      <span>Specify Payment Mode / Description *</span>
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Cheque, Forex Card, Crypto, Gift Voucher, Company Reimbursement"
                      value={customPaymentMode}
                      onChange={e => setCustomPaymentMode(e.target.value)}
                      className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#555] bg-white dark:bg-[#181818] text-[#1A1A1A] dark:text-[#F0ECE1] font-mono text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                    />
                  </div>
                )}
              </div>
            )}
          </form>
        )}
      </div>

      {/* List View */}
      <div className="bg-white dark:bg-[#1A1A1A] border border-[#1A1A1A] dark:border-[#383838] shadow-[4px_4px_0px_#1A1A1A] sm:shadow-[8px_8px_0px_#1A1A1A] dark:shadow-[8px_8px_0px_#000] p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end border-b-2 border-[#1A1A1A] dark:border-[#383838] pb-3 mb-4 sm:mb-6 gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold tracking-tight text-[#1A1A1A] dark:text-[#F0ECE1]">
              Expenses ({currentMonth})
            </h2>
            <p className="text-[10px] uppercase tracking-widest text-[#666] dark:text-[#A0A0A0] mt-0.5">
              {transactions.length} record{transactions.length === 1 ? '' : 's'} logged
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs uppercase font-bold tracking-widest text-[#666] dark:text-[#A0A0A0] block sm:inline mr-2">Total</span>
            <span className="text-xl sm:text-2xl font-serif font-bold text-red-700 dark:text-rose-400">
              ₹{totalExpense.toLocaleString()}
            </span>
          </div>
        </div>
        
        {loading ? (
          <p className="text-xs font-mono uppercase tracking-widest text-[#666] dark:text-[#A0A0A0] py-4">Loading expenses...</p>
        ) : transactions.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424] my-2">
            <p className="text-xs font-mono uppercase tracking-widest text-[#666] dark:text-[#A0A0A0]">No expenses logged for this month.</p>
          </div>
        ) : (
          <div>
            {/* Mobile Card List */}
            <div className="block sm:hidden space-y-3">
              {transactions.map(tx => (
                <div key={tx.id} className="border border-dashed border-[#1A1A1A] dark:border-[#444] p-3 bg-[#FCFAF7] dark:bg-[#242424] flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-[#666] dark:text-[#999] block flex items-center gap-1">
                        <CalendarIcon className="w-2.5 h-2.5 inline" /> {tx.date}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] dark:text-[#F0ECE1] inline-flex items-center gap-1 mt-0.5">
                        <Tag className="w-3 h-3 text-[#666] dark:text-[#999]" /> {tx.category_id}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-mono font-bold text-red-700 dark:text-rose-400 block">
                        ₹{tx.amount.toLocaleString()}
                      </span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 bg-gray-200 dark:bg-[#333] text-[#1A1A1A] dark:text-[#E0E0E0] font-mono">
                        {tx.payment_mode}
                      </span>
                    </div>
                  </div>

                  {tx.note && (
                    <p className="text-xs font-mono text-[#555] dark:text-[#CCC] bg-white dark:bg-[#1A1A1A] p-1.5 border border-gray-200 dark:border-[#383838]">
                      {tx.note}
                    </p>
                  )}

                  <div className="flex justify-end pt-1 border-t border-dotted border-gray-300 dark:border-[#444]">
                    <button 
                      onClick={() => tx.id && handleDelete(tx.id)}
                      className="text-[10px] font-mono uppercase font-bold text-red-700 dark:text-rose-400 hover:opacity-70 inline-flex items-center gap-1 p-1 touch-manipulation"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-[#1A1A1A] dark:border-[#383838] text-[10px] uppercase tracking-widest text-[#555] dark:text-[#A0A0A0]">
                    <th className="py-2.5 px-2">Date</th>
                    <th className="py-2.5 px-2">Category</th>
                    <th className="py-2.5 px-2">Note</th>
                    <th className="py-2.5 px-2">Mode</th>
                    <th className="py-2.5 px-2 text-right">Amount</th>
                    <th className="py-2.5 px-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-mono">
                  {transactions.map(tx => (
                    <tr key={tx.id} className="border-b border-[#1A1A1A] dark:border-[#333] border-dotted hover:bg-[#FCFAF7] dark:hover:bg-[#242424] transition-colors">
                      <td className="py-2.5 px-2 text-[#1A1A1A] dark:text-[#F0ECE1]">{tx.date}</td>
                      <td className="py-2.5 px-2 uppercase font-semibold text-[#1A1A1A] dark:text-[#F0ECE1]">{tx.category_id}</td>
                      <td className="py-2.5 px-2 text-[#666] dark:text-[#A0A0A0] max-w-[200px] truncate">{tx.note || "-"}</td>
                      <td className="py-2.5 px-2 uppercase text-[10px] text-[#555] dark:text-[#999]">{tx.payment_mode}</td>
                      <td className="py-2.5 px-2 text-right font-bold text-red-700 dark:text-rose-400">₹{tx.amount.toLocaleString()}</td>
                      <td className="py-2.5 px-2 text-center">
                        <button 
                          onClick={() => tx.id && handleDelete(tx.id)} 
                          className="text-[10px] uppercase font-bold tracking-wider text-red-700 dark:text-rose-400 hover:opacity-70 p-1"
                          title="Delete transaction"
                        >
                          Del
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
