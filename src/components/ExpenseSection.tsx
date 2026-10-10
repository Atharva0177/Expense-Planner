import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getTransactions,
  getAllTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getCategories,
  addCategory,
} from "../lib/db";
import { uploadReceiptPhoto, fetchReceiptPhoto, deleteReceiptPhoto } from "../lib/storage";
import { Transaction, Category } from "../types";
import {
  PlusCircle,
  Trash2,
  Tag,
  Calendar as CalendarIcon,
  Camera,
  Loader2,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Key,
  Search,
  Paperclip,
  X,
  Scissors,
} from "lucide-react";
import { processImageForOCR, isHeicFile } from "../lib/imageUtils";
import { scanReceiptWithFallback } from "../lib/receiptScanner";

interface EditState {
  id: string;
  amount: number;
  categoryId: string;
  date: string;
  note: string;
  paymentMode: string;
}

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
    return (
      (typeof window !== "undefined"
        ? localStorage.getItem("expense_planner_gemini_key")
        : "") || ""
    );
  });

  // Search state (queries all months, not just the selected one)
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Transaction[] | null>(null);
  const [searching, setSearching] = useState(false);

  // Split state
  const [splitCount, setSplitCount] = useState(1);

  // Edit modal state
  const [editing, setEditing] = useState<EditState | null>(null);

  // Receipt attachment: keep the scanned image blob around so it can be
  // uploaded together with the transaction created from it
  const [pendingReceiptBlob, setPendingReceiptBlob] = useState<Blob | null>(null);

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
        getCategories(user.uid),
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
    setScanStatus(
      isHeicFile(file)
        ? "Converting HEIC photo and analyzing receipt..."
        : "Analyzing receipt image with Gemini...",
    );

    try {
      // Process image (converts .heic/.heif to JPEG, resizes if huge)
      const { imageBase64, mimeType, blob } = await processImageForOCR(file);
      setPendingReceiptBlob(blob || null);

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
        const matchedCategory = categories.find(
          (c) => c.name.toLowerCase() === data.category.toLowerCase(),
        );
        if (matchedCategory) {
          setCategoryId(matchedCategory.name);
          detectedDetails.push(matchedCategory.name);
        } else {
          setCategoryId("__OTHER__");
          setCustomCategory(data.category);
          detectedDetails.push(`Category: ${data.category}`);
        }
      }

      setScanStatus(
        `Receipt parsed successfully: ${detectedDetails.join(" • ")}${
          blob ? " • photo will be attached" : ""
        }`,
      );
      setTimeout(() => setScanStatus(null), 6000);
    } catch (err: any) {
      console.error("Receipt scan failed:", err);
      setScanError(
        err.message ||
          "Failed to analyze receipt. Please try another image or enter manually.",
      );
      setTimeout(() => setScanError(null), 8000);
    } finally {
      setScanning(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || amount <= 0) return;

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

    let finalPaymentMode = paymentMode;
    if (paymentMode === "__OTHER__") {
      finalPaymentMode = customPaymentMode.trim() || "Other";
    }

    const parts = Math.max(1, Math.min(5, Math.floor(splitCount) || 1));
    const share = Math.round((amount / parts) * 100) / 100;

    let attachNote = "";
    for (let i = 0; i < parts; i++) {
      const txId = await addTransaction({
        user_id: user.uid,
        category_id: finalCategory,
        amount: parts === 1 ? amount : i === parts - 1 ? Math.round((amount - share * (parts - 1)) * 100) / 100 : share,
        date,
        note:
          parts === 1
            ? note
            : `${note || finalCategory} (split ${i + 1}/${parts})`.trim(),
        payment_mode: finalPaymentMode as any,
        source: "manual",
      });

      // Attach the scanned receipt photo to the first split transaction.
      // STRICTLY best-effort: a failed upload must never block saving,
      // never create duplicates, and must tell the user what happened.
      // Photos are stored IN Firestore (free) - no Cloud Storage required.
      if (i === 0 && pendingReceiptBlob && txId) {
        try {
          const attached = await uploadReceiptPhoto(
            user.uid,
            txId,
            pendingReceiptBlob,
          );
          if (attached) {
            await updateTransaction(txId, { has_receipt_photo: true });
            attachNote = "Receipt photo attached to the new entry.";
          } else {
            attachNote =
              "Saved without the photo: the image could not be compressed " +
              "small enough for storage. The entry itself is safe.";
          }
        } catch (attachErr) {
          console.warn("Receipt attachment failed:", attachErr);
          attachNote = "Saved without the photo (attachment failed - entry is safe).";
        }
      }
    }
    setPendingReceiptBlob(null);

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
    setSplitCount(1);
    fetchData();

    if (attachNote) {
      setScanStatus(attachNote);
      setTimeout(() => setScanStatus(null), 12000);
    }
  };

  const handleDelete = async (id: string, hasPhoto?: boolean) => {
    await deleteTransaction(id);
    // Cleanup only when a photo doc actually exists (deleting a missing doc
    // would be denied by the rules and just log noise)
    if (hasPhoto) {
      deleteReceiptPhoto(id);
    }
    fetchData();
    if (searchResults) handleSearch(new Event("noop") as any, true);
  };

  // Receipt photo viewer: lazily fetches the stored photo on click and
  // opens it in a new tab (photos are NOT loaded with the transaction list).
  const [openingPhoto, setOpeningPhoto] = useState<string | null>(null);
  const handleOpenReceipt = async (tx: Transaction) => {
    if (!tx.id || openingPhoto) return;
    setOpeningPhoto(tx.id);
    try {
      const dataUrl = await fetchReceiptPhoto(tx.id);
      if (dataUrl) {
        const w = window.open();
        if (w) {
          w.document.write(
            `<title>Receipt ${tx.date}</title><body style="margin:0;background:#1a1a1a;display:flex;align-items:center;justify-content:center;min-height:100vh"><img src="${dataUrl}" style="max-width:100%;max-height:100vh" alt="Receipt photo"/></body>`,
          );
        } else {
          // Popup blocked - fall back to a direct navigation
          window.location.href = dataUrl;
        }
      } else {
        setScanError("The stored receipt photo could not be loaded.");
        setTimeout(() => setScanError(null), 6000);
      }
    } finally {
      setOpeningPhoto(null);
    }
  };

  const ReceiptIcon = ({ tx }: { tx: Transaction }) =>
    tx.has_receipt_photo ? (
      <button
        type="button"
        onClick={() => handleOpenReceipt(tx)}
        title="View attached receipt photo"
        className="text-blue-700 dark:text-sky-400 hover:opacity-70 shrink-0"
      >
        {openingPhoto === tx.id ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin inline" />
        ) : (
          <Paperclip className="w-3.5 h-3.5 inline" />
        )}
      </button>
    ) : null;

  const handleSearch = async (
    e: React.FormEvent | any,
    silent: boolean = false,
  ) => {
    if (e?.preventDefault) e.preventDefault();
    if (!user) return;
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const all = await getAllTransactions(user.uid);
      const matches = (all || [])
        .filter(
          (t) =>
            (t.note || "").toLowerCase().includes(q) ||
            (t.category_id || "").toLowerCase().includes(q) ||
            (t.payment_mode || "").toLowerCase().includes(q) ||
            String(t.amount).includes(q) ||
            (t.date || "").includes(q),
        )
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
        .slice(0, 100);
      setSearchResults(matches);
    } catch (err) {
      console.warn("Search failed:", err);
      if (!silent) setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !user) return;
    let finalCategory = editing.categoryId;
    if (editing.categoryId === "__OTHER__") {
      finalCategory = (editing.note.trim() ? editing.categoryId : finalCategory) as string;
      finalCategory = "Other";
    }
    await updateTransaction(editing.id, {
      amount: editing.amount,
      category_id: finalCategory === "__OTHER__" ? "Other" : finalCategory,
      date: editing.date,
      note: editing.note,
      payment_mode: editing.paymentMode as any,
    });
    setEditing(null);
    fetchData();
    if (searchResults) handleSearch(null, true);
  };

  const startEdit = (tx: Transaction) => {
    if (!tx.id) return;
    setEditing({
      id: tx.id,
      amount: tx.amount,
      categoryId: tx.category_id,
      date: tx.date,
      note: tx.note || "",
      paymentMode: tx.payment_mode,
    });
  };

  const totalExpense = transactions.reduce((sum, t) => sum + t.amount, 0);

  const isOtherCategory = categoryId === "__OTHER__";
  const isOtherPaymentMode = paymentMode === "__OTHER__";

  const renderList = (list: Transaction[], label: string, sublabel: string) => (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-end border-b-2 border-[#1A1A1A] dark:border-[#383838] pb-3 mb-4 sm:mb-6 gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold tracking-tight text-[#1A1A1A] dark:text-[#F0ECE1]">
            {label}
          </h2>
          <p className="text-[10px] uppercase tracking-widest text-[#666] dark:text-[#A0A0A0] mt-0.5">
            {sublabel}
          </p>
        </div>
        {list === transactions && (
          <div className="text-left sm:text-right">
            <span className="text-xs uppercase font-bold tracking-widest text-[#666] dark:text-[#A0A0A0] block sm:inline mr-2">
              Total
            </span>
            <span className="text-xl sm:text-2xl font-serif font-bold text-red-700 dark:text-rose-400">
              ₹{totalExpense.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {list.length === 0 ? (
        <div className="p-6 text-center border border-dashed border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424] my-2">
          <p className="text-xs font-mono uppercase tracking-widest text-[#666] dark:text-[#A0A0A0]">
            {list === transactions
              ? "No expenses logged for this month."
              : "No matches found."}
          </p>
        </div>
      ) : (
        <div>
          {/* Mobile Card List */}
          <div className="block sm:hidden space-y-3">
            {list.map((tx) => (
              <div
                key={tx.id}
                className="border border-dashed border-[#1A1A1A] dark:border-[#444] p-3 bg-[#FCFAF7] dark:bg-[#242424] flex flex-col gap-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono text-[#666] dark:text-[#999] block flex items-center gap-1">
                      <CalendarIcon className="w-2.5 h-2.5 inline" /> {tx.date}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] dark:text-[#F0ECE1] inline-flex items-center gap-1 mt-0.5">
                      <Tag className="w-3 h-3 text-[#666] dark:text-[#999]" />{" "}
                      {tx.category_id}
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

                {(tx.note || tx.has_receipt_photo) && (
                  <p className="text-xs font-mono text-[#555] dark:text-[#CCC] bg-white dark:bg-[#1A1A1A] p-1.5 border border-gray-200 dark:border-[#383838] flex items-center justify-between gap-2">
                    <span className="truncate">{tx.note || "Receipt photo"}</span>
                    <ReceiptIcon tx={tx} />
                  </p>
                )}

                <div className="flex justify-end gap-3 pt-1 border-t border-dotted border-gray-300 dark:border-[#444]">
                  <button
                    onClick={() => startEdit(tx)}
                    className="text-[10px] font-mono uppercase font-bold text-blue-700 dark:text-sky-400 hover:opacity-70 inline-flex items-center gap-1 p-1 touch-manipulation"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => tx.id && handleDelete(tx.id, tx.has_receipt_photo)}
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
                {list.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-[#1A1A1A] dark:border-[#333] border-dotted hover:bg-[#FCFAF7] dark:hover:bg-[#242424] transition-colors"
                  >
                    <td className="py-2.5 px-2 text-[#1A1A1A] dark:text-[#F0ECE1]">
                      {tx.date}
                    </td>
                    <td className="py-2.5 px-2 uppercase font-semibold text-[#1A1A1A] dark:text-[#F0ECE1]">
                      {tx.category_id}
                    </td>
                    <td className="py-2.5 px-2 text-[#666] dark:text-[#A0A0A0] max-w-[200px] truncate">
                      {tx.note ? (
                        <span className="inline-flex items-center gap-1.5">
                          {tx.note}
                          <ReceiptIcon tx={tx} />
                        </span>
                      ) : tx.has_receipt_photo ? (
                        <span className="inline-flex items-center gap-1.5">
                          Receipt photo
                          <ReceiptIcon tx={tx} />
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-2.5 px-2 uppercase text-[10px] text-[#555] dark:text-[#999]">
                      {tx.payment_mode}
                    </td>
                    <td className="py-2.5 px-2 text-right font-bold text-red-700 dark:text-rose-400">
                      ₹{tx.amount.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 text-center whitespace-nowrap">
                      <button
                        onClick={() => startEdit(tx)}
                        className="text-[10px] uppercase font-bold tracking-wider text-blue-700 dark:text-sky-400 hover:opacity-70 p-1 mr-2"
                        title="Edit transaction"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => tx.id && handleDelete(tx.id, tx.has_receipt_photo)}
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
  );

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* Entry Form */}
      <div className="bg-white dark:bg-[#1A1A1A] border border-[#1A1A1A] dark:border-[#383838] p-4 sm:p-6 md:p-8 relative shadow-[3px_3px_0px_#1A1A1A] sm:shadow-[6px_6px_0px_#1A1A1A] dark:shadow-[6px_6px_0px_#000]">
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <span className="bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest inline-block w-max">
              Log Expense
            </span>
            <label
              className={`cursor-pointer text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5 transition-all w-max ${scanning ? "text-[#666] dark:text-[#999]" : "text-blue-700 dark:text-sky-400 hover:text-blue-900 dark:hover:text-sky-300"}`}
            >
              {scanning ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5" />
              )}
              <span>
                {scanning ? "Processing..." : "Scan Receipt (JPG, PNG, HEIC)"}
              </span>
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
            <button
              onClick={() => setScanStatus(null)}
              className="text-[10px] uppercase hover:underline"
            >
              ✕
            </button>
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
              <button
                onClick={() => setScanError(null)}
                className="text-[10px] uppercase hover:underline"
              >
                ✕
              </button>
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
                <button
                  onClick={() => setShowApiKeyModal(false)}
                  className="text-xs font-mono text-[#888] hover:text-black dark:hover:text-white"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs font-mono text-[#555] dark:text-[#AAA] leading-relaxed">
                For Cloudflare Pages and static hosting, receipt scanning can
                run directly in your browser with your Gemini API key.
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
                      localStorage.setItem(
                        "expense_planner_gemini_key",
                        apiKeyInput.trim(),
                      );
                      setScanError(null);
                      setScanStatus(
                        "API Key saved! You can now scan receipts.",
                      );
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
                  <Loader2 className="w-4 h-4 animate-spin" />{" "}
                  {scanStatus || "Analyzing Receipt Image..."}
                </span>
                <p className="text-[10px] font-mono text-[#666] dark:text-[#AAA]">
                  Converting format, extracting total amount, date, and vendor
                  details
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 items-end">
              <div className="sm:col-span-1 lg:col-span-2">
                <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none focus:border-[2px] dark:focus:border-white font-mono text-xs"
                />
              </div>

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

              <div className="sm:col-span-1 lg:col-span-3">
                <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                  Mode & Note
                </label>
                <div className="flex border border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] focus-within:border-[2px] dark:focus-within:border-white">
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="bg-transparent border-r border-[#1A1A1A] dark:border-[#444] px-2 py-2 font-mono text-[10px] uppercase outline-none shrink-0 text-[#1A1A1A] dark:text-[#F0ECE1]"
                  >
                    <option
                      value="UPI"
                      className="bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1]"
                    >
                      UPI
                    </option>
                    <option
                      value="Card"
                      className="bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1]"
                    >
                      Card
                    </option>
                    <option
                      value="Cash"
                      className="bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1]"
                    >
                      Cash
                    </option>
                    <option
                      value="Netbanking"
                      className="bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1]"
                    >
                      NetB
                    </option>
                    <option
                      value="__OTHER__"
                      className="bg-white dark:bg-[#1A1A1A] text-amber-700 dark:text-amber-400 font-bold"
                    >
                      Other...
                    </option>
                  </select>
                  <input
                    type="text"
                    placeholder="Note (optional)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-2 py-2 bg-transparent focus:outline-none font-mono text-xs min-w-0 text-[#1A1A1A] dark:text-[#F0ECE1]"
                  />
                </div>
              </div>

              <div className="sm:col-span-1 lg:col-span-1">
                <label
                  className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1 flex items-center gap-1"
                  title="Split this amount into equal parts (creates multiple entries)"
                >
                  <Scissors className="w-3 h-3" />
                  Split ×
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={splitCount}
                  onChange={(e) =>
                    setSplitCount(Math.max(1, Math.min(5, Number(e.target.value) || 1)))
                  }
                  className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none font-mono text-xs text-center"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-1">
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
                      onChange={(e) => setCustomCategory(e.target.value)}
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
                      onChange={(e) => setCustomPaymentMode(e.target.value)}
                      className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#555] bg-white dark:bg-[#181818] text-[#1A1A1A] dark:text-[#F0ECE1] font-mono text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                    />
                  </div>
                )}
              </div>
            )}

            {pendingReceiptBlob && (
              <p className="text-[10px] font-mono text-[#666] dark:text-[#999] flex items-center gap-1.5">
                <Paperclip className="w-3 h-3" />
                Scanned receipt photo will be attached to this entry
                <button
                  type="button"
                  onClick={() => setPendingReceiptBlob(null)}
                  className="underline hover:no-underline"
                >
                  (don't attach)
                </button>
              </p>
            )}
          </form>
        )}
      </div>

      {/* Search + List View */}
      <div className="bg-white dark:bg-[#1A1A1A] border border-[#1A1A1A] dark:border-[#383838] shadow-[4px_4px_0px_#1A1A1A] sm:shadow-[8px_8px_0px_#1A1A1A] dark:shadow-[8px_8px_0px_#000] p-4 sm:p-6 md:p-8">
        {/* Search across all months */}
        <form
          onSubmit={handleSearch}
          className="mb-6 flex gap-2 items-center border-2 border-[#1A1A1A] dark:border-[#383838] p-1 bg-[#FCFAF7] dark:bg-[#242424]"
        >
          <Search className="w-4 h-4 ml-1.5 text-[#666] dark:text-[#999] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!e.target.value.trim()) setSearchResults(null);
            }}
            placeholder="Search all months: note, category, amount, date..."
            className="flex-1 px-1 py-1.5 bg-transparent focus:outline-none font-mono text-xs text-[#1A1A1A] dark:text-[#F0ECE1] min-w-0"
          />
          {searching ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#666] dark:text-[#999] mx-2 shrink-0" />
          ) : (
            <button
              type="submit"
              className="bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] px-3 py-1.5 text-[10px] font-mono uppercase font-bold tracking-wider hover:opacity-90 shrink-0"
            >
              Search
            </button>
          )}
          {searchResults && (
            <button
              type="button"
              onClick={() => {
                setSearchResults(null);
                setSearchQuery("");
              }}
              title="Clear search"
              className="text-[#666] dark:text-[#999] hover:text-[#1A1A1A] dark:hover:text-white px-1 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        {loading ? (
          <p className="text-xs font-mono uppercase tracking-widest text-[#666] dark:text-[#A0A0A0] py-4">
            Loading expenses...
          </p>
        ) : searchResults ? (
          renderList(
            searchResults,
            "Search Results",
            `${searchResults.length} match${searchResults.length === 1 ? "" : "es"} across all months`,
          )
        ) : (
          renderList(
            transactions,
            `Expenses (${currentMonth})`,
            `${transactions.length} record${transactions.length === 1 ? "" : "s"} logged`,
          )
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#FCFAF7] dark:bg-[#1C1C1C] border border-[#1A1A1A] dark:border-[#333] max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-[#EBE7DF] dark:border-[#2E2E2E] pb-3">
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-[#1A1A1A] dark:text-white">
                Edit Transaction
              </h3>
              <button
                onClick={() => setEditing(null)}
                className="text-xs font-mono text-[#888] hover:text-black dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editing.amount || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, amount: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-white dark:bg-[#242424] text-xs font-mono text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={editing.date}
                    onChange={(e) =>
                      setEditing({ ...editing, date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-white dark:bg-[#242424] text-xs font-mono text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                  Category
                </label>
                <select
                  value={editing.categoryId}
                  onChange={(e) =>
                    setEditing({ ...editing, categoryId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-white dark:bg-[#242424] text-xs font-mono uppercase text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id || c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                  {!categories.some((c) => c.name === editing.categoryId) && (
                    <option value={editing.categoryId}>{editing.categoryId}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                  Mode & Note
                </label>
                <div className="flex border border-[#1A1A1A] dark:border-[#444] bg-white dark:bg-[#242424] focus-within:border-2 dark:focus-within:border-white">
                  <select
                    value={editing.paymentMode}
                    onChange={(e) =>
                      setEditing({ ...editing, paymentMode: e.target.value })
                    }
                    className="bg-transparent border-r border-[#1A1A1A] dark:border-[#444] px-2 py-2 font-mono text-[10px] uppercase outline-none shrink-0 text-[#1A1A1A] dark:text-[#F0ECE1]"
                  >
                    {["UPI", "Card", "Cash", "Netbanking", "Other"].map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Note"
                    value={editing.note}
                    onChange={(e) =>
                      setEditing({ ...editing, note: e.target.value })
                    }
                    className="w-full px-2 py-2 bg-transparent focus:outline-none font-mono text-xs min-w-0 text-[#1A1A1A] dark:text-[#F0ECE1]"
                  />
                </div>
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
