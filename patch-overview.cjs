const fs = require("fs");
let code = fs.readFileSync("src/components/OverviewSection.tsx", "utf8");

// Add imports
code = code.replace(
  'import { Transaction, IncomeEntry, Budget, Goal, Loan } from "../types";',
  'import { Transaction, IncomeEntry, Budget, Goal, Loan, HouseholdMember } from "../types";\nimport { getHouseholdMembers } from "../lib/db_household";',
);

// Add state
code = code.replace(
  "const [loans, setLoans] = useState<Loan[]>([]);",
  "const [loans, setLoans] = useState<Loan[]>([]);\n  const [members, setMembers] = useState<HouseholdMember[]>([]);\n  const [showMemberBreakdown, setShowMemberBreakdown] = useState(false);",
);

// Update fetch
code = code.replace("getLoans(user.uid)", "getLoans(user.uid)");
code = code.replace(
  "setLoans(loanData);",
  'setLoans(loanData);\n      if (user) {\n        import("../lib/db_household").then(({getHouseholdMembership, getHouseholdMembers}) => {\n          getHouseholdMembership(user.uid).then(m => {\n            if(m) getHouseholdMembers(m.household_id).then(setMembers);\n          });\n        });\n      }',
);

// Add toggle and breakdown UI
const summaryUI = `
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
`;
const newSummaryUI = `
      <div className="flex justify-end">
        <label className="flex items-center gap-2 cursor-pointer text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]">
          <input type="checkbox" checked={showMemberBreakdown} onChange={e => setShowMemberBreakdown(e.target.checked)} className="accent-[#1A1A1A]" />
          Show Per-Member Breakdown
        </label>
      </div>
      
      {showMemberBreakdown && members.length > 0 && (
        <div className="border border-[#1A1A1A] bg-white p-6 shadow-[4px_4px_0px_#1A1A1A] mb-6">
          <h3 className="text-lg font-serif italic tracking-tight text-[#1A1A1A] mb-4 border-b border-[#1A1A1A] pb-2">Member Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-[#1A1A1A] text-[10px] uppercase tracking-widest text-[#555]">
                  <th className="p-2 font-bold">Member</th>
                  <th className="p-2 font-bold">Role</th>
                  <th className="p-2 font-bold">Income</th>
                  <th className="p-2 font-bold">Expenses</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => {
                  const mInc = incomeEntries.filter(i => i.user_id === m.user_id).reduce((sum, i) => sum + (i.net_credited || 0), 0);
                  const mExp = transactions.filter(t => t.user_id === m.user_id).reduce((sum, t) => sum + t.amount, 0);
                  return (
                    <tr key={m.id} className="border-b border-[#1A1A1A] border-dotted text-xs font-mono">
                      <td className="p-2">{m.email}</td>
                      <td className="p-2 uppercase text-[10px]">{m.role}</td>
                      <td className="p-2 text-green-700">₹{mInc.toLocaleString()}</td>
                      <td className="p-2 text-red-700">₹{mExp.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
`;
code = code.replace(summaryUI, newSummaryUI);

fs.writeFileSync("src/components/OverviewSection.tsx", code);
