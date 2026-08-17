import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { 
  getInvestmentAccounts, 
  addInvestmentAccount, 
  getInvestmentHoldings, 
  addInvestmentHolding, 
  getLatestValuation, 
  addInvestmentValuation 
} from "../lib/db_household";
import { InvestmentAccount, InvestmentHolding, InvestmentValuation } from "../types";
import { TrendingUp, PlusCircle, RefreshCw, Briefcase, ChevronRight, Layers, DollarSign } from "lucide-react";

export function InvestmentSection() {
  const { user, household } = useAuth();
  const [accounts, setAccounts] = useState<InvestmentAccount[]>([]);
  const [holdings, setHoldings] = useState<Record<string, InvestmentHolding[]>>({});
  const [valuations, setValuations] = useState<Record<string, InvestmentValuation>>({});
  const [loading, setLoading] = useState(true);

  // New Account Form
  const [accName, setAccName] = useState("");
  const [accType, setAccType] = useState<InvestmentAccount["type"]>("mutual_fund");
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

  useEffect(() => {
    if (household) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [household]);

  const loadData = async () => {
    if (!household) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const accs = await getInvestmentAccounts(household.id!);
      setAccounts(accs || []);
      
      if (accs && accs.length > 0 && !selectedAccount) {
        setSelectedAccount(accs[0].id!);
      }
      
      const hData: Record<string, InvestmentHolding[]> = {};
      const vData: Record<string, InvestmentValuation> = {};
      
      for (const acc of (accs || [])) {
        hData[acc.id!] = await getInvestmentHoldings(acc.id!);
        const latestVal = await getLatestValuation(acc.id!);
        if (latestVal) {
          vData[acc.id!] = latestVal;
        }
      }
      setHoldings(hData);
      setValuations(vData);
    } catch (e) {
      console.warn("Notice loading investments:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !household || !accName.trim()) return;
    await addInvestmentAccount({
      user_id: user.uid,
      household_id: household.id!,
      name: accName.trim(),
      type: accType,
      folio_number: accFolio.trim() || undefined
    });
    setAccName("");
    setAccFolio("");
    loadData();
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
      purchase_date: holdingDate
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
    
    const acc = accounts.find(a => a.id === selectedAccount);
    const isUnitBased = acc?.type === "mutual_fund" || acc?.type === "stock" || acc?.type === "gold";
    
    if (isUnitBased) {
      totalUnits = currentHoldings.reduce((sum, h) => sum + (h.units || 0), 0);
    }
    
    const totalValue = isUnitBased ? totalUnits * valPrice : valPrice;
    
    await addInvestmentValuation({
      user_id: user.uid,
      investment_account_id: selectedAccount,
      date: valDate,
      price_or_nav: valPrice,
      total_value: totalValue
    });
    setValPrice(0);
    setValDate("");
    loadData();
  };

  if (!household) return null;

  // Calculate totals
  let totalInvested = 0;
  let totalCurrentValue = 0;

  accounts.forEach(acc => {
    const accHoldings = holdings[acc.id!] || [];
    const invested = accHoldings.reduce((sum, h) => {
      const isUnitBased = acc.type === "mutual_fund" || acc.type === "stock" || acc.type === "gold";
      if (isUnitBased) return sum + ((h.units || 0) * h.purchase_price);
      return sum + (h.amount || h.purchase_price || 0);
    }, 0);
    totalInvested += invested;

    const currentVal = valuations[acc.id!]?.total_value || invested;
    totalCurrentValue += currentVal;
  });

  const absoluteReturn = totalCurrentValue - totalInvested;
  const returnPercent = totalInvested > 0 ? ((absoluteReturn / totalInvested) * 100).toFixed(2) : "0.00";

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      <div className="border-b-2 border-[#1A1A1A] pb-2">
        <h2 className="text-xl sm:text-2xl font-serif italic tracking-tight text-[#1A1A1A]">Household Portfolio</h2>
        <p className="text-[10px] uppercase font-mono tracking-widest text-[#666] mt-0.5">Asset allocations & net valuation</p>
      </div>

      {/* Portfolio Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        <div className="border border-[#1A1A1A] bg-white p-4 sm:p-6 shadow-[3px_3px_0px_#1A1A1A] sm:shadow-[4px_4px_0px_#1A1A1A]">
          <p className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-[#555] mb-1">Total Invested</p>
          <p className="text-2xl sm:text-3xl font-mono font-bold text-[#1A1A1A]">₹{totalInvested.toLocaleString()}</p>
        </div>
        <div className="border border-[#1A1A1A] bg-white p-4 sm:p-6 shadow-[3px_3px_0px_#1A1A1A] sm:shadow-[4px_4px_0px_#1A1A1A]">
          <p className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-[#555] mb-1">Current Value</p>
          <p className="text-2xl sm:text-3xl font-mono font-bold text-[#1A1A1A]">₹{totalCurrentValue.toLocaleString()}</p>
        </div>
        <div className="border border-[#1A1A1A] bg-white p-4 sm:p-6 shadow-[3px_3px_0px_#1A1A1A] sm:shadow-[4px_4px_0px_#1A1A1A]">
          <p className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-[#555] mb-1">Absolute Return</p>
          <div className="flex items-baseline gap-2">
            <p className={`text-2xl sm:text-3xl font-mono font-bold ${absoluteReturn >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              ₹{Math.abs(absoluteReturn).toLocaleString()}
            </p>
            <span className={`text-[11px] font-mono font-bold ${absoluteReturn >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              ({absoluteReturn >= 0 ? '+' : '-'}{returnPercent}%)
            </span>
          </div>
        </div>
      </div>

      {/* New Account Form */}
      <div className="border border-[#1A1A1A] bg-white p-4 sm:p-6 shadow-[3px_3px_0px_#1A1A1A] sm:shadow-[4px_4px_0px_#1A1A1A]">
        <h3 className="text-base sm:text-lg font-serif italic tracking-tight text-[#1A1A1A] mb-3 sm:mb-4 border-b border-[#1A1A1A] pb-2 flex items-center gap-2">
          <PlusCircle className="w-4 h-4" />
          <span>New Investment Account</span>
        </h3>
        <form onSubmit={handleAddAccount} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-end">
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] mb-1">Account Name</label>
            <input 
              type="text" 
              placeholder="e.g. Zerodha Equity, Parag Parikh Flexi"
              value={accName} 
              onChange={e => setAccName(e.target.value)} 
              required
              className="w-full px-3 py-2 border border-[#1A1A1A] bg-[#FCFAF7] font-mono text-xs focus:outline-none focus:border-[2px]" 
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] mb-1">Asset Class</label>
            <select 
              value={accType} 
              onChange={e => setAccType(e.target.value as any)}
              className="w-full px-3 py-2 border border-[#1A1A1A] bg-[#FCFAF7] font-mono text-xs uppercase focus:outline-none focus:border-[2px]"
            >
              <option value="mutual_fund">Mutual Fund</option>
              <option value="stock">Stock / Equity</option>
              <option value="fd">Fixed Deposit (FD)</option>
              <option value="ppf">PPF</option>
              <option value="nps">NPS</option>
              <option value="gold">Sovereign Gold / Gold</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] mb-1">Folio / Acc ID (Optional)</label>
            <input 
              type="text" 
              placeholder="Folio or Demat No."
              value={accFolio} 
              onChange={e => setAccFolio(e.target.value)}
              className="w-full px-3 py-2 border border-[#1A1A1A] bg-[#FCFAF7] font-mono text-xs focus:outline-none focus:border-[2px]" 
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-[#1A1A1A] text-white px-4 py-2 font-bold uppercase tracking-widest text-[10px] hover:bg-gray-800 transition-colors touch-manipulation min-h-[38px]"
          >
            Create Account
          </button>
        </form>
      </div>

      {/* Account Master-Detail Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Accounts List */}
        <div className="lg:col-span-4 border border-[#1A1A1A] bg-white p-4 sm:p-6 shadow-[3px_3px_0px_#1A1A1A] sm:shadow-[4px_4px_0px_#1A1A1A] flex flex-col">
          <h3 className="text-base sm:text-lg font-serif italic tracking-tight text-[#1A1A1A] mb-3 sm:mb-4 border-b border-[#1A1A1A] pb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Briefcase className="w-4 h-4" />
              <span>Accounts</span>
            </span>
            <span className="text-[10px] font-mono text-[#666]">({accounts.length})</span>
          </h3>
          
          {loading ? (
            <p className="text-xs font-mono text-[#666] py-4">Loading accounts...</p>
          ) : accounts.length === 0 ? (
            <p className="text-xs font-mono uppercase tracking-wider text-[#666] py-6 text-center">
              No investment accounts added yet.
            </p>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-[350px] lg:max-h-[500px]">
              {accounts.map(acc => {
                const accVal = valuations[acc.id!]?.total_value;
                return (
                  <button 
                    key={acc.id} 
                    onClick={() => setSelectedAccount(acc.id!)}
                    className={`w-full text-left p-3 border transition-colors touch-manipulation flex items-center justify-between ${
                      selectedAccount === acc.id 
                        ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-[2px_2px_0px_#666]' 
                        : 'border-[#1A1A1A] bg-[#FCFAF7] text-[#1A1A1A] hover:bg-gray-100'
                    }`}
                  >
                    <div>
                      <div className="text-xs uppercase font-bold tracking-wider">{acc.name}</div>
                      <div className={`text-[10px] font-mono mt-0.5 uppercase ${selectedAccount === acc.id ? 'text-gray-300' : 'text-[#666]'}`}>
                        {acc.type.replace('_', ' ')}
                      </div>
                    </div>
                    {accVal !== undefined && (
                      <div className="text-right">
                        <div className="font-mono text-xs font-bold">₹{accVal.toLocaleString()}</div>
                        <div className={`text-[9px] font-mono ${selectedAccount === acc.id ? 'text-gray-300' : 'text-[#666]'}`}>Current</div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Account Details & Manage */}
        <div className="lg:col-span-8 border border-[#1A1A1A] bg-white p-4 sm:p-6 shadow-[3px_3px_0px_#1A1A1A] sm:shadow-[4px_4px_0px_#1A1A1A]">
          {selectedAccount ? (() => {
            const acc = accounts.find(a => a.id === selectedAccount);
            if (!acc) return null;
            const accHoldings = holdings[acc.id!] || [];
            const isUnitBased = acc.type === "mutual_fund" || acc.type === "stock" || acc.type === "gold";
            const latestVal = valuations[acc.id!];
            
            return (
              <div className="space-y-6">
                <div className="border-b border-[#1A1A1A] pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div>
                    <h3 className="text-lg sm:text-xl font-serif italic tracking-tight text-[#1A1A1A]">{acc.name}</h3>
                    <p className="text-[10px] uppercase font-mono text-[#666]">
                      {acc.type.replace('_', ' ')} {acc.folio_number && `• Folio: ${acc.folio_number}`}
                    </p>
                  </div>
                  {latestVal && (
                    <div className="bg-[#FCFAF7] border border-[#1A1A1A] px-3 py-1 self-start sm:self-auto">
                      <span className="text-[9px] uppercase font-mono text-[#666] block">Latest Value ({latestVal.date})</span>
                      <span className="font-mono font-bold text-sm">₹{latestVal.total_value.toLocaleString()}</span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Add Holding Form */}
                  <form onSubmit={handleAddHolding} className="space-y-3 border border-[#1A1A1A] p-4 bg-[#FCFAF7]">
                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] flex items-center gap-1.5 border-b border-[#1A1A1A] pb-1">
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Record Purchase / Holding</span>
                    </h4>
                    {isUnitBased ? (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] uppercase font-bold tracking-widest text-[#1A1A1A] mb-1">Units</label>
                          <input 
                            type="number" 
                            step="any" 
                            value={holdingUnits || ''} 
                            placeholder="0"
                            onChange={e => setHoldingUnits(Number(e.target.value))} 
                            required 
                            className="w-full px-2 py-1.5 border border-[#1A1A1A] font-mono text-xs bg-white focus:outline-none" 
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase font-bold tracking-widest text-[#1A1A1A] mb-1">Buy NAV/Price (₹)</label>
                          <input 
                            type="number" 
                            step="any" 
                            value={holdingPrice || ''} 
                            placeholder="0.00"
                            onChange={e => setHoldingPrice(Number(e.target.value))} 
                            required 
                            className="w-full px-2 py-1.5 border border-[#1A1A1A] font-mono text-xs bg-white focus:outline-none" 
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[9px] uppercase font-bold tracking-widest text-[#1A1A1A] mb-1">Invested Amount (₹)</label>
                        <input 
                          type="number" 
                          step="any" 
                          value={holdingAmount || ''} 
                          placeholder="0"
                          onChange={e => setHoldingAmount(Number(e.target.value))} 
                          required 
                          className="w-full px-2 py-1.5 border border-[#1A1A1A] font-mono text-xs bg-white focus:outline-none" 
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-[9px] uppercase font-bold tracking-widest text-[#1A1A1A] mb-1">Purchase Date</label>
                      <input 
                        type="date" 
                        value={holdingDate} 
                        onChange={e => setHoldingDate(e.target.value)} 
                        required 
                        className="w-full px-2 py-1.5 border border-[#1A1A1A] font-mono text-xs bg-white focus:outline-none" 
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="w-full bg-[#1A1A1A] text-white py-2 font-bold uppercase tracking-widest text-[9px] hover:bg-gray-800 transition-colors touch-manipulation min-h-[34px]"
                    >
                      Record Holding
                    </button>
                  </form>

                  {/* Add Valuation Form */}
                  <form onSubmit={handleAddValuation} className="space-y-3 border border-[#1A1A1A] p-4 bg-[#FCFAF7]">
                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] flex items-center gap-1.5 border-b border-[#1A1A1A] pb-1">
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Update Market Valuation</span>
                    </h4>
                    <div>
                      <label className="block text-[9px] uppercase font-bold tracking-widest text-[#1A1A1A] mb-1">
                        {isUnitBased ? "Current NAV / Share Price (₹)" : "Current Total Value (₹)"}
                      </label>
                      <input 
                        type="number" 
                        step="any" 
                        placeholder="0.00"
                        value={valPrice || ''} 
                        onChange={e => setValPrice(Number(e.target.value))} 
                        required 
                        className="w-full px-2 py-1.5 border border-[#1A1A1A] font-mono text-xs bg-white focus:outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-bold tracking-widest text-[#1A1A1A] mb-1">Valuation Date</label>
                      <input 
                        type="date" 
                        value={valDate} 
                        onChange={e => setValDate(e.target.value)} 
                        required 
                        className="w-full px-2 py-1.5 border border-[#1A1A1A] font-mono text-xs bg-white focus:outline-none" 
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="w-full bg-[#2A4B3A] text-white py-2 font-bold uppercase tracking-widest text-[9px] hover:opacity-90 transition-opacity touch-manipulation min-h-[34px]"
                    >
                      Save Valuation
                    </button>
                  </form>
                </div>

                {/* Holdings Table */}
                <div>
                  <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] mb-2">Recorded Holdings ({accHoldings.length})</h4>
                  {accHoldings.length === 0 ? (
                    <p className="text-xs font-mono text-[#666] py-3 italic">No purchase transactions logged yet.</p>
                  ) : (
                    <div className="overflow-x-auto border border-[#1A1A1A]">
                      <table className="w-full text-left border-collapse min-w-[280px]">
                        <thead>
                          <tr className="bg-[#1A1A1A] text-white text-[9px] uppercase font-mono">
                            <th className="p-2">Date</th>
                            {isUnitBased && <th className="p-2">Units</th>}
                            <th className="p-2">{isUnitBased ? "Buy Price" : "Amount"}</th>
                            {isUnitBased && <th className="p-2 text-right">Total</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {accHoldings.map((h, i) => (
                            <tr key={h.id || i} className="border-b border-gray-200 text-xs font-mono hover:bg-[#FCFAF7]">
                              <td className="p-2">{h.purchase_date}</td>
                              {isUnitBased && <td className="p-2">{h.units}</td>}
                              <td className="p-2">₹{(isUnitBased ? h.purchase_price : h.amount)?.toLocaleString()}</td>
                              {isUnitBased && (
                                <td className="p-2 text-right font-bold">
                                  ₹{((h.units || 0) * h.purchase_price).toLocaleString()}
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
          })() : (
            <div className="py-12 text-center">
              <p className="text-[11px] uppercase font-mono tracking-widest text-[#666]">
                Select an account from the left to view details and update valuation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
