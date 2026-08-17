import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getTransactions, addTransaction, deleteTransaction, getCategories } from "../lib/db";
import { Transaction, Category } from "../types";
import { PlusCircle, Trash2, Tag, Calendar as CalendarIcon, Camera, Loader2 } from "lucide-react";

export function ExpenseSection({ currentMonth }: { currentMonth: string }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(true);
  const [scanning, setScanning] = useState(false);

  // Form State
  const [amount, setAmount] = useState<number>(0);
  const [categoryId, setCategoryId] = useState<string>("");
  const [date, setDate] = useState<string>(`${currentMonth}-01`);
  const [note, setNote] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<Transaction["payment_mode"]>("UPI");

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
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64String = reader.result as string;
          const match = base64String.match(/^data:(image\/[a-zA-Z0-9+]+);base64,(.*)$/);
          if (!match) throw new Error("Failed to parse image data");
          
          const mimeType = match[1];
          const imageBase64 = match[2];

          const response = await fetch("/api/scan-receipt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64, mimeType })
          });

          if (!response.ok) {
            throw new Error("Failed to scan receipt");
          }

          const data = await response.json();
          
          if (data.amount) setAmount(data.amount);
          if (data.date) setDate(data.date);
          if (data.merchant) setNote(data.merchant);
          
          if (data.category) {
            const matchedCategory = categories.find(c => c.name.toLowerCase() === data.category.toLowerCase());
            if (matchedCategory) {
              setCategoryId(matchedCategory.name);
            } else {
              setNote(prev => prev ? `${prev} [${data.category}]` : `[${data.category}]`);
            }
          }
        } catch (err) {
          console.error(err);
          alert("Failed to process receipt image.");
        } finally {
          setScanning(false);
          e.target.value = '';
        }
      };
      reader.onerror = () => {
        setScanning(false);
        e.target.value = '';
      };
    } catch (err) {
      console.error(err);
      setScanning(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || amount <= 0) return;
    
    await addTransaction({
      user_id: user.uid,
      category_id: categoryId,
      amount,
      date,
      note,
      payment_mode: paymentMode,
      source: "manual"
    });
    
    setAmount(0); 
    setNote(""); 
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await deleteTransaction(id);
    fetchData();
  };

  const totalExpense = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* Entry Form */}
      <div className="bg-white border border-[#1A1A1A] p-4 sm:p-6 md:p-8 relative shadow-[3px_3px_0px_#1A1A1A] sm:shadow-[6px_6px_0px_#1A1A1A]">
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span className="bg-[#1A1A1A] text-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest inline-block w-max">
              Log Expense
            </span>
            <label className={`cursor-pointer text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5 transition-all w-max ${scanning ? 'text-[#666]' : 'text-blue-700 hover:text-blue-900'}`}>
              {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              <span>{scanning ? "Scanning..." : "Scan Receipt"}</span>
              <input 
                type="file" 
                accept="image/*" 
                capture="environment"
                className="hidden" 
                onChange={handleScanReceipt} 
                disabled={scanning}
              />
            </label>
          </div>
          <button 
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="sm:hidden text-[10px] uppercase font-bold tracking-wider underline text-[#1A1A1A]"
          >
            {showForm ? "Collapse Form" : "+ Expand Form"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 items-end relative">
            {scanning && (
              <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
                <span className="bg-[#1A1A1A] text-white px-4 py-2 text-xs font-mono font-bold uppercase tracking-widest flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Analyzing Image...
                </span>
              </div>
            )}
            <div className="sm:col-span-1 lg:col-span-2">
              <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] mb-1">Date</label>
              <input 
                type="date" 
                required 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                className="w-full px-3 py-2 border border-[#1A1A1A] bg-[#FCFAF7] focus:outline-none focus:border-[2px] font-mono text-xs" 
              />
            </div>
            
            <div className="sm:col-span-1 lg:col-span-3">
              <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] mb-1">Category</label>
              <select 
                required 
                value={categoryId} 
                onChange={e => setCategoryId(e.target.value)} 
                className="w-full px-3 py-2 border border-[#1A1A1A] bg-[#FCFAF7] focus:outline-none focus:border-[2px] font-mono text-xs uppercase"
              >
                {categories.map(c => (
                  <option key={c.id || c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-1 lg:col-span-2">
              <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] mb-1">Amount (₹)</label>
              <input 
                type="number" 
                required 
                min="1"
                placeholder="0"
                value={amount || ''} 
                onChange={e => setAmount(Number(e.target.value))} 
                className="w-full px-3 py-2 border border-[#1A1A1A] bg-[#FCFAF7] focus:outline-none focus:border-[2px] font-mono text-xs font-bold" 
              />
            </div>

            <div className="sm:col-span-1 lg:col-span-3">
              <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] mb-1">Mode & Note</label>
              <div className="flex border border-[#1A1A1A] bg-[#FCFAF7] focus-within:border-[2px]">
                <select 
                  value={paymentMode} 
                  onChange={e => setPaymentMode(e.target.value as any)} 
                  className="bg-transparent border-r border-[#1A1A1A] px-2 py-2 font-mono text-[10px] uppercase outline-none shrink-0"
                >
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Netbanking">NetB</option>
                </select>
                <input 
                  type="text" 
                  placeholder="Note (optional)" 
                  value={note} 
                  onChange={e => setNote(e.target.value)} 
                  className="w-full px-2 py-2 bg-transparent focus:outline-none font-mono text-xs min-w-0" 
                />
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-2">
              <button 
                type="submit" 
                className="w-full bg-[#1A1A1A] text-white py-2.5 px-4 font-bold uppercase tracking-widest text-xs hover:bg-gray-800 transition-colors active:scale-95 touch-manipulation min-h-[38px] flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* List View */}
      <div className="bg-white border border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] sm:shadow-[8px_8px_0px_#1A1A1A] p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end border-b-2 border-[#1A1A1A] pb-3 mb-4 sm:mb-6 gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold tracking-tight text-[#1A1A1A]">
              Expenses ({currentMonth})
            </h2>
            <p className="text-[10px] uppercase tracking-widest text-[#666] mt-0.5">
              {transactions.length} record{transactions.length === 1 ? '' : 's'} logged
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs uppercase font-bold tracking-widest text-[#666] block sm:inline mr-2">Total</span>
            <span className="text-xl sm:text-2xl font-serif font-bold text-red-700">
              ₹{totalExpense.toLocaleString()}
            </span>
          </div>
        </div>
        
        {loading ? (
          <p className="text-xs font-mono uppercase tracking-widest text-[#666] py-4">Loading expenses...</p>
        ) : transactions.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-[#1A1A1A] bg-[#FCFAF7] my-2">
            <p className="text-xs font-mono uppercase tracking-widest text-[#666]">No expenses logged for this month.</p>
          </div>
        ) : (
          <div>
            {/* Mobile Card List */}
            <div className="block sm:hidden space-y-3">
              {transactions.map(tx => (
                <div key={tx.id} className="border border-dashed border-[#1A1A1A] p-3 bg-[#FCFAF7] flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-[#666] block flex items-center gap-1">
                        <CalendarIcon className="w-2.5 h-2.5 inline" /> {tx.date}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] inline-flex items-center gap-1 mt-0.5">
                        <Tag className="w-3 h-3 text-[#666]" /> {tx.category_id}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-mono font-bold text-red-700 block">
                        ₹{tx.amount.toLocaleString()}
                      </span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 bg-gray-200 text-[#1A1A1A] font-mono">
                        {tx.payment_mode}
                      </span>
                    </div>
                  </div>

                  {tx.note && (
                    <p className="text-xs font-mono text-[#555] bg-white p-1.5 border border-gray-200">
                      {tx.note}
                    </p>
                  )}

                  <div className="flex justify-end pt-1 border-t border-dotted border-gray-300">
                    <button 
                      onClick={() => tx.id && handleDelete(tx.id)}
                      className="text-[10px] font-mono uppercase font-bold text-red-700 hover:opacity-70 inline-flex items-center gap-1 p-1 touch-manipulation"
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
                  <tr className="border-b-2 border-[#1A1A1A] text-[10px] uppercase tracking-widest text-[#555]">
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
                    <tr key={tx.id} className="border-b border-[#1A1A1A] border-dotted hover:bg-[#FCFAF7] transition-colors">
                      <td className="py-2.5 px-2">{tx.date}</td>
                      <td className="py-2.5 px-2 uppercase font-semibold">{tx.category_id}</td>
                      <td className="py-2.5 px-2 text-[#666] max-w-[200px] truncate">{tx.note || "-"}</td>
                      <td className="py-2.5 px-2 uppercase text-[10px]">{tx.payment_mode}</td>
                      <td className="py-2.5 px-2 text-right font-bold text-red-700">₹{tx.amount.toLocaleString()}</td>
                      <td className="py-2.5 px-2 text-center">
                        <button 
                          onClick={() => tx.id && handleDelete(tx.id)} 
                          className="text-[10px] uppercase font-bold tracking-wider text-red-700 hover:opacity-70 p-1"
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
