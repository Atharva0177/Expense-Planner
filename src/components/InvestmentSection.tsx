import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getHouseholdMembership,
  getInvestmentAccounts,
  addInvestmentAccount,
  getInvestmentHoldings,
  addInvestmentHolding,
  getLatestValuation,
  addInvestmentValuation,
} from "../lib/db_household";
import {
  InvestmentAccount,
  InvestmentHolding,
  InvestmentValuation,
} from "../types";
import {
  TrendingUp,
  PlusCircle,
  RefreshCw,
  Briefcase,
  ChevronRight,
  Layers,
  DollarSign,
  Tag,
} from "lucide-react";

export function InvestmentSection() {
  const { user, household, refreshHousehold } = useAuth();
  const [activeHhId, setActiveHhId] = useState<string | null>(
    household?.id || null,
  );
  const [accounts, setAccounts] = useState<InvestmentAccount[]>([]);
  const [holdings, setHoldings] = useState<Record<string, InvestmentHolding[]>>(
    {},
  );
  const [valuations, setValuations] = useState<
    Record<string, InvestmentValuation>
  >({});
  const [loading, setLoading] = useState(true);

  // New Account Form
  const [accName, setAccName] = useState("");
  const [accType, setAccType] =
    useState<InvestmentAccount["type"]>("mutual_fund");
  const [customAccType, setCustomAccType] = useState("");
  const [accFolio, setAccFolio] = useState("");

  // Select Account for details
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  // New Holding Form
  const [holdingUnits, setHoldingUnits] = useState<number>(0);
  const [holdingAmount, setHoldingAmount] = useState<number>(0);
  const [holdingPrice, setHoldingPrice] = useState<number>(0);
  const [holdingDate, setHoldingDate] = useState<string>("");

  // New Valuation Form
  const [valPrice, setValPrice] = useState<number>(0);
  const [valDate, setValDate] = useState<string>("");

  const loadData = async (targetHhId?: string) => {
    const hhId = targetHhId || activeHhId || household?.id;
    if (!hhId) {
      if (!user) {
        setLoading(false);
        return;
      }
      // Resolve household membership if context hasn't populated yet
      try {
        let member = await getHouseholdMembership(user.uid);
        if (!member) {
          await refreshHousehold();
          member = await getHouseholdMembership(user.uid);
        }
        if (member?.household_id) {
          setActiveHhId(member.household_id);
          return loadData(member.household_id);
        }
      } catch (e) {
        console.warn("Could not resolve household for investments:", e);
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const accs = await getInvestmentAccounts(hhId);
      setAccounts(accs || []);

      if (accs && accs.length > 0 && !selectedAccount) {
        setSelectedAccount(accs[0].id!);
      }

      const hData: Record<string, InvestmentHolding[]> = {};
      const vData: Record<string, InvestmentValuation> = {};

      // Parallel fetch holdings and valuations for all accounts
      await Promise.all(
        (accs || []).map(async (acc) => {
          if (!acc.id) return;
          const [hList, latestVal] = await Promise.all([
            getInvestmentHoldings(acc.id),
            getLatestValuation(acc.id),
          ]);
          hData[acc.id] = hList || [];
          if (latestVal) {
            vData[acc.id] = latestVal;
          }
        }),
      );

      setHoldings(hData);
      setValuations(vData);
    } catch (e) {
      console.warn("Notice loading investments:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (household?.id) {
      setActiveHhId(household.id);
    }
    loadData(household?.id);
  }, [user, household?.id]);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveHhId = activeHhId || household?.id;
    if (!user || !effectiveHhId || !accName.trim()) return;
    await addInvestmentAccount({
      user_id: user.uid,
      household_id: effectiveHhId,
      name: accName.trim(),
      type: accType,
      custom_type_description:
        accType === "other" ? customAccType.trim() || "Other" : undefined,
      folio_number: accFolio.trim() || undefined,
    });
    setAccName("");
    setAccFolio("");
    setCustomAccType("");
    if (accType === "other") {
      setAccType("mutual_fund");
    }
    loadData(effectiveHhId);
  };

  const handleAddHolding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedAccount || !holdingDate) return;
    await addInvestmentHolding({
      user_id: user.uid,
      investment_account_id: selectedAccount,
      units: holdingUnits || undefined,
      amount: holdingAmount || undefined,
      purchase_price: holdingPrice,
      purchase_date: holdingDate,
    });
    setHoldingUnits(0);
    setHoldingAmount(0);
    setHoldingPrice(0);
    setHoldingDate("");
    loadData();
  };

  const handleAddValuation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedAccount || !valDate || valPrice <= 0) return;

    const currentHoldings = holdings[selectedAccount] || [];
    let totalUnits = 0;

    const acc = accounts.find((a) => a.id === selectedAccount);
    const isUnitBased =
      acc?.type === "mutual_fund" ||
      acc?.type === "stock" ||
      acc?.type === "gold";

    if (isUnitBased) {
      totalUnits = currentHoldings.reduce((sum, h) => sum + (h.units || 0), 0);
    }

    const totalValue = isUnitBased ? totalUnits * valPrice : valPrice;

    await addInvestmentValuation({
      user_id: user.uid,
      investment_account_id: selectedAccount,
      date: valDate,
      price_or_nav: valPrice,
      total_value: totalValue,
    });
    setValPrice(0);
    setValDate("");
    loadData();
  };

  if (loading && accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-[#1A1A1A]" />
        <p className="font-mono text-xs uppercase tracking-widest text-[#555]">
          Loading Investment Portfolio...
        </p>
      </div>
    );
  }

  // Calculate totals
  let totalInvested = 0;
  let totalCurrentValue = 0;

  accounts.forEach((acc) => {
    const accHoldings = holdings[acc.id!] || [];
    const invested = accHoldings.reduce((sum, h) => {
      const isUnitBased =
        acc.type === "mutual_fund" ||
        acc.type === "stock" ||
        acc.type === "gold";
      if (isUnitBased) return sum + (h.units || 0) * h.purchase_price;
      return sum + (h.amount || h.purchase_price || 0);
    }, 0);
    totalInvested += invested;

    const currentVal = valuations[acc.id!]?.total_value || invested;
    totalCurrentValue += currentVal;
  });

  const absoluteReturn = totalCurrentValue - totalInvested;
  const returnPercent =
    totalInvested > 0
      ? ((absoluteReturn / totalInvested) * 100).toFixed(2)
      : "0.00";

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      <div className="border-b-2 border-[#1A1A1A] dark:border-[#383838] pb-2">
        <h2 className="text-xl sm:text-2xl font-serif italic tracking-tight text-[#1A1A1A] dark:text-[#F0ECE1]">
          Household Portfolio
        </h2>
        <p className="text-[10px] uppercase font-mono tracking-widest text-[#666] dark:text-[#A0A0A0] mt-0.5">
          Asset allocations & net valuation
        </p>
      </div>

      {/* Portfolio Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        <div className="border border-[#1A1A1A] dark:border-[#383838] bg-white dark:bg-[#1A1A1A] p-4 sm:p-6 shadow-[3px_3px_0px_#1A1A1A] sm:shadow-[4px_4px_0px_#1A1A1A] dark:shadow-[4px_4px_0px_#000]">
          <p className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-[#555] dark:text-[#A0A0A0] mb-1">
            Total Invested
          </p>
          <p className="text-2xl sm:text-3xl font-mono font-bold text-[#1A1A1A] dark:text-[#F0ECE1]">
            ₹{totalInvested.toLocaleString()}
          </p>
        </div>
        <div className="border border-[#1A1A1A] dark:border-[#383838] bg-white dark:bg-[#1A1A1A] p-4 sm:p-6 shadow-[3px_3px_0px_#1A1A1A] sm:shadow-[4px_4px_0px_#1A1A1A] dark:shadow-[4px_4px_0px_#000]">
          <p className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-[#555] dark:text-[#A0A0A0] mb-1">
            Current Value
          </p>
          <p className="text-2xl sm:text-3xl font-mono font-bold text-[#1A1A1A] dark:text-[#F0ECE1]">
            ₹{totalCurrentValue.toLocaleString()}
          </p>
        </div>
        <div className="border border-[#1A1A1A] dark:border-[#383838] bg-white dark:bg-[#1A1A1A] p-4 sm:p-6 shadow-[3px_3px_0px_#1A1A1A] sm:shadow-[4px_4px_0px_#1A1A1A] dark:shadow-[4px_4px_0px_#000]">
          <p className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-[#555] dark:text-[#A0A0A0] mb-1">
            Absolute Return
          </p>
          <div className="flex items-baseline gap-2">
            <p
              className={`text-2xl sm:text-3xl font-mono font-bold ${absoluteReturn >= 0 ? "text-green-700 dark:text-emerald-400" : "text-red-700 dark:text-rose-400"}`}
            >
              ₹{Math.abs(absoluteReturn).toLocaleString()}
            </p>
            <span
              className={`text-[11px] font-mono font-bold ${absoluteReturn >= 0 ? "text-green-700 dark:text-emerald-400" : "text-red-700 dark:text-rose-400"}`}
            >
              ({absoluteReturn >= 0 ? "+" : "-"}
              {returnPercent}%)
            </span>
          </div>
        </div>
      </div>

      {/* New Account Form */}
      <div className="border border-[#1A1A1A] dark:border-[#383838] bg-white dark:bg-[#1A1A1A] p-4 sm:p-6 shadow-[3px_3px_0px_#1A1A1A] sm:shadow-[4px_4px_0px_#1A1A1A] dark:shadow-[4px_4px_0px_#000]">
        <h3 className="text-base sm:text-lg font-serif italic tracking-tight text-[#1A1A1A] dark:text-[#F0ECE1] mb-3 sm:mb-4 border-b border-[#1A1A1A] dark:border-[#383838] pb-2 flex items-center gap-2">
          <PlusCircle className="w-4 h-4" />
          <span>New Investment Account</span>
        </h3>
        <form onSubmit={handleAddAccount} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-end">
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                Account Name
              </label>
              <input
                type="text"
                placeholder="e.g. Zerodha Equity, Parag Parikh Flexi"
                value={accName}
                onChange={(e) => setAccName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] font-mono text-xs focus:outline-none focus:border-[2px] dark:focus:border-white"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                Asset Class
              </label>
              <select
                value={accType}
                onChange={(e) => setAccType(e.target.value as any)}
                className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] font-mono text-xs uppercase focus:outline-none focus:border-[2px] dark:focus:border-white"
              >
                <option
                  value="mutual_fund"
                  className="bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1]"
                >
                  Mutual Fund
                </option>
                <option
                  value="stock"
                  className="bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1]"
                >
                  Stock / Equity
                </option>
                <option
                  value="fd"
                  className="bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1]"
                >
                  Fixed Deposit (FD)
                </option>
                <option
                  value="ppf"
                  className="bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1]"
                >
                  PPF
                </option>
                <option
                  value="nps"
                  className="bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1]"
                >
                  NPS
                </option>
                <option
                  value="gold"
                  className="bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1]"
                >
                  Sovereign Gold / Gold
                </option>
                <option
                  value="other"
                  className="bg-white dark:bg-[#1A1A1A] text-amber-700 dark:text-amber-400 font-bold"
                >
                  + Other (Custom Asset Class)...
                </option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                Folio / Acc ID (Optional)
              </label>
              <input
                type="text"
                placeholder="Folio or Demat No."
                value={accFolio}
                onChange={(e) => setAccFolio(e.target.value)}
                className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#444] bg-[#FCFAF7] dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] font-mono text-xs focus:outline-none focus:border-[2px] dark:focus:border-white"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] px-4 py-2 font-bold uppercase tracking-widest text-[10px] hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors touch-manipulation min-h-[38px] shadow-[2px_2px_0px_#777] dark:shadow-[2px_2px_0px_#000]"
            >
              Create Account
            </button>
          </div>

          {/* Conditional "Other" Input Field */}
          {accType === "other" && (
            <div className="p-3 bg-[#F5F2EB] dark:bg-[#202020] border border-[#1A1A1A] dark:border-[#444] animate-in fade-in duration-200">
              <label className="block text-[10px] uppercase font-bold tracking-widest text-amber-800 dark:text-amber-300 mb-1 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                <span>Specify Asset Class Description *</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Real Estate / REITs, Cryptocurrency, P2P Lending, Venture Equity, Collectibles"
                value={customAccType}
                onChange={(e) => setCustomAccType(e.target.value)}
                className="w-full px-3 py-2 border border-[#1A1A1A] dark:border-[#555] bg-white dark:bg-[#181818] text-[#1A1A1A] dark:text-[#F0ECE1] font-mono text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              />
            </div>
          )}
        </form>
      </div>

      {/* Account Master-Detail Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Accounts List */}
        <div className="lg:col-span-4 border border-[#1A1A1A] dark:border-[#383838] bg-white dark:bg-[#1A1A1A] p-4 sm:p-6 shadow-[3px_3px_0px_#1A1A1A] sm:shadow-[4px_4px_0px_#1A1A1A] dark:shadow-[4px_4px_0px_#000] flex flex-col">
          <h3 className="text-base sm:text-lg font-serif italic tracking-tight text-[#1A1A1A] dark:text-[#F0ECE1] mb-3 sm:mb-4 border-b border-[#1A1A1A] dark:border-[#383838] pb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Briefcase className="w-4 h-4" />
              <span>Accounts</span>
            </span>
            <span className="text-[10px] font-mono text-[#666] dark:text-[#A0A0A0]">
              ({accounts.length})
            </span>
          </h3>

          {loading ? (
            <p className="text-xs font-mono text-[#666] dark:text-[#A0A0A0] py-4">
              Loading accounts...
            </p>
          ) : accounts.length === 0 ? (
            <p className="text-xs font-mono uppercase tracking-wider text-[#666] dark:text-[#A0A0A0] py-6 text-center">
              No investment accounts added yet.
            </p>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-[350px] lg:max-h-[500px]">
              {accounts.map((acc) => {
                const accVal = valuations[acc.id!]?.total_value;
                return (
                  <button
                    key={acc.id}
                    onClick={() => setSelectedAccount(acc.id!)}
                    className={`w-full text-left p-3 border transition-colors touch-manipulation flex items-center justify-between ${
                      selectedAccount === acc.id
                        ? "border-[#1A1A1A] dark:border-white bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] shadow-[2px_2px_0px_#666]"
                        : "border-[#1A1A1A] dark:border-[#383838] bg-[#FCFAF7] dark:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1] hover:bg-gray-100 dark:hover:bg-[#2c2c2c]"
                    }`}
                  >
                    <div>
                      <div className="text-xs uppercase font-bold tracking-wider">
                        {acc.name}
                      </div>
                      <div
                        className={`text-[10px] font-mono mt-0.5 uppercase ${selectedAccount === acc.id ? "text-gray-300 dark:text-gray-600" : "text-[#666] dark:text-[#A0A0A0]"}`}
                      >
                        {acc.custom_type_description ||
                          (acc.type === "other"
                            ? "Other"
                            : acc.type.replace("_", " "))}
                      </div>
                    </div>
                    {accVal !== undefined && (
                      <div className="text-right">
                        <div className="font-mono text-xs font-bold">
                          ₹{accVal.toLocaleString()}
                        </div>
                        <div
                          className={`text-[9px] font-mono ${selectedAccount === acc.id ? "text-gray-300 dark:text-gray-600" : "text-[#666] dark:text-[#A0A0A0]"}`}
                        >
                          Current
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Account Details & Manage */}
        <div className="lg:col-span-8 border border-[#1A1A1A] dark:border-[#383838] bg-white dark:bg-[#1A1A1A] p-4 sm:p-6 shadow-[3px_3px_0px_#1A1A1A] sm:shadow-[4px_4px_0px_#1A1A1A] dark:shadow-[4px_4px_0px_#000]">
          {selectedAccount ? (
            (() => {
              const acc = accounts.find((a) => a.id === selectedAccount);
              if (!acc) return null;
              const accHoldings = holdings[acc.id!] || [];
              const isUnitBased =
                acc.type === "mutual_fund" ||
                acc.type === "stock" ||
                acc.type === "gold";
              const latestVal = valuations[acc.id!];

              return (
                <div className="space-y-6">
                  <div className="border-b border-[#1A1A1A] dark:border-[#383838] pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div>
                      <h3 className="text-lg sm:text-xl font-serif italic tracking-tight text-[#1A1A1A] dark:text-[#F0ECE1]">
                        {acc.name}
                      </h3>
                      <p className="text-[10px] uppercase font-mono text-[#666] dark:text-[#A0A0A0]">
                        {acc.custom_type_description ||
                          (acc.type === "other"
                            ? "Other"
                            : acc.type.replace("_", " "))}{" "}
                        {acc.folio_number && `• Folio: ${acc.folio_number}`}
                      </p>
                    </div>
                    {latestVal && (
                      <div className="bg-[#FCFAF7] dark:bg-[#242424] border border-[#1A1A1A] dark:border-[#383838] px-3 py-1 self-start sm:self-auto">
                        <span className="text-[9px] uppercase font-mono text-[#666] dark:text-[#A0A0A0] block">
                          Latest Value ({latestVal.date})
                        </span>
                        <span className="font-mono font-bold text-sm text-[#1A1A1A] dark:text-[#F0ECE1]">
                          ₹{latestVal.total_value.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Add Holding Form */}
                    <form
                      onSubmit={handleAddHolding}
                      className="space-y-3 border border-[#1A1A1A] dark:border-[#383838] p-4 bg-[#FCFAF7] dark:bg-[#242424]"
                    >
                      <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] flex items-center gap-1.5 border-b border-[#1A1A1A] dark:border-[#383838] pb-1">
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Record Purchase / Holding</span>
                      </h4>
                      {isUnitBased ? (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                              Units
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={holdingUnits || ""}
                              placeholder="0"
                              onChange={(e) =>
                                setHoldingUnits(Number(e.target.value))
                              }
                              required
                              className="w-full px-2 py-1.5 border border-[#1A1A1A] dark:border-[#444] font-mono text-xs bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                              Buy NAV/Price (₹)
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={holdingPrice || ""}
                              placeholder="0.00"
                              onChange={(e) =>
                                setHoldingPrice(Number(e.target.value))
                              }
                              required
                              className="w-full px-2 py-1.5 border border-[#1A1A1A] dark:border-[#444] font-mono text-xs bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[9px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                            Invested Amount (₹)
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={holdingAmount || ""}
                            placeholder="0"
                            onChange={(e) =>
                              setHoldingAmount(Number(e.target.value))
                            }
                            required
                            className="w-full px-2 py-1.5 border border-[#1A1A1A] dark:border-[#444] font-mono text-xs bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-[9px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                          Purchase Date
                        </label>
                        <input
                          type="date"
                          value={holdingDate}
                          onChange={(e) => setHoldingDate(e.target.value)}
                          required
                          className="w-full px-2 py-1.5 border border-[#1A1A1A] dark:border-[#444] font-mono text-xs bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] py-2 font-bold uppercase tracking-widest text-[9px] hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors touch-manipulation min-h-[34px]"
                      >
                        Record Holding
                      </button>
                    </form>

                    {/* Add Valuation Form */}
                    <form
                      onSubmit={handleAddValuation}
                      className="space-y-3 border border-[#1A1A1A] dark:border-[#383838] p-4 bg-[#FCFAF7] dark:bg-[#242424]"
                    >
                      <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] flex items-center gap-1.5 border-b border-[#1A1A1A] dark:border-[#383838] pb-1">
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Update Market Valuation</span>
                      </h4>
                      <div>
                        <label className="block text-[9px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                          {isUnitBased
                            ? "Current NAV / Share Price (₹)"
                            : "Current Total Value (₹)"}
                        </label>
                        <input
                          type="number"
                          step="any"
                          placeholder="0.00"
                          value={valPrice || ""}
                          onChange={(e) => setValPrice(Number(e.target.value))}
                          required
                          className="w-full px-2 py-1.5 border border-[#1A1A1A] dark:border-[#444] font-mono text-xs bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-1">
                          Valuation Date
                        </label>
                        <input
                          type="date"
                          value={valDate}
                          onChange={(e) => setValDate(e.target.value)}
                          required
                          className="w-full px-2 py-1.5 border border-[#1A1A1A] dark:border-[#444] font-mono text-xs bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F0ECE1] focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-[#2A4B3A] dark:bg-emerald-700 text-white py-2 font-bold uppercase tracking-widest text-[9px] hover:opacity-90 transition-opacity touch-manipulation min-h-[34px]"
                      >
                        Save Valuation
                      </button>
                    </form>
                  </div>

                  {/* Holdings Table */}
                  <div>
                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] dark:text-[#E0E0E0] mb-2">
                      Recorded Holdings ({accHoldings.length})
                    </h4>
                    {accHoldings.length === 0 ? (
                      <p className="text-xs font-mono text-[#666] dark:text-[#A0A0A0] py-3 italic">
                        No purchase transactions logged yet.
                      </p>
                    ) : (
                      <div className="overflow-x-auto border border-[#1A1A1A] dark:border-[#383838]">
                        <table className="w-full text-left border-collapse min-w-[280px]">
                          <thead>
                            <tr className="bg-[#1A1A1A] dark:bg-[#282828] text-white text-[9px] uppercase font-mono">
                              <th className="p-2">Date</th>
                              {isUnitBased && <th className="p-2">Units</th>}
                              <th className="p-2">
                                {isUnitBased ? "Buy Price" : "Amount"}
                              </th>
                              {isUnitBased && (
                                <th className="p-2 text-right">Total</th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {accHoldings.map((h, i) => (
                              <tr
                                key={h.id || i}
                                className="border-b border-gray-200 dark:border-[#333] text-xs font-mono hover:bg-[#FCFAF7] dark:hover:bg-[#242424] text-[#1A1A1A] dark:text-[#F0ECE1]"
                              >
                                <td className="p-2">{h.purchase_date}</td>
                                {isUnitBased && (
                                  <td className="p-2">{h.units}</td>
                                )}
                                <td className="p-2">
                                  ₹
                                  {(isUnitBased
                                    ? h.purchase_price
                                    : h.amount
                                  )?.toLocaleString()}
                                </td>
                                {isUnitBased && (
                                  <td className="p-2 text-right font-bold">
                                    ₹
                                    {(
                                      (h.units || 0) * h.purchase_price
                                    ).toLocaleString()}
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="py-12 text-center">
              <p className="text-[11px] uppercase font-mono tracking-widest text-[#666] dark:text-[#A0A0A0]">
                Select an account from the left to view details and update
                valuation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
