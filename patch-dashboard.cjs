const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// Add imports
code = code.replace(
  'import { ReportSection } from "../components/ReportSection";',
  'import { ReportSection } from "../components/ReportSection";\nimport { HouseholdSettings } from "../components/HouseholdSettings";\nimport { InvestmentSection } from "../components/InvestmentSection";'
);

// Add state to activeTab
code = code.replace(
  'const [activeTab, setActiveTab] = useState<"overview" | "income" | "expense" | "budgets" | "recurring" | "loans" | "goals" | "taxes" | "reports">("overview");',
  'const [activeTab, setActiveTab] = useState<"overview" | "income" | "expense" | "budgets" | "recurring" | "loans" | "goals" | "taxes" | "reports" | "household" | "investments">("overview");'
);

// Destructure householdMember
code = code.replace(
  'const { user } = useAuth();',
  'const { user, householdMember } = useAuth();\n  const isDependent = householdMember?.role === "dependent";'
);

// Add tab buttons logic
const buttonRepl = `
          <button 
            onClick={() => setActiveTab("overview")}
            className={\`shrink-0 whitespace-nowrap px-4 py-2 text-[10px] uppercase font-bold tracking-widest transition-colors \${
              activeTab === "overview" 
                ? "bg-[#1A1A1A] text-white" 
                : "border border-[#1A1A1A] text-[#1A1A1A] hover:bg-gray-100"
            }\`}
          >
            Overview
          </button>
`;
const newButtonRepl = `
          <button 
            onClick={() => setActiveTab("overview")}
            className={\`shrink-0 whitespace-nowrap px-4 py-2 text-[10px] uppercase font-bold tracking-widest transition-colors \${
              activeTab === "overview" 
                ? "bg-[#1A1A1A] text-white" 
                : "border border-[#1A1A1A] text-[#1A1A1A] hover:bg-gray-100"
            }\`}
          >
            Overview
          </button>
          
          <button 
            onClick={() => setActiveTab("household")}
            className={\`shrink-0 whitespace-nowrap px-4 py-2 text-[10px] uppercase font-bold tracking-widest transition-colors \${
              activeTab === "household" 
                ? "bg-[#1A1A1A] text-white" 
                : "border border-[#1A1A1A] text-[#1A1A1A] hover:bg-gray-100"
            }\`}
          >
            Family
          </button>
`;
code = code.replace(buttonRepl, newButtonRepl);

// Add Investments button (only for adults)
const investmentButton = `
          {!isDependent && (
          <button 
            onClick={() => setActiveTab("investments")}
            className={\`shrink-0 whitespace-nowrap px-4 py-2 text-[10px] uppercase font-bold tracking-widest transition-colors \${
              activeTab === "investments" 
                ? "bg-[#1A1A1A] text-white" 
                : "border border-[#1A1A1A] text-[#1A1A1A] hover:bg-gray-100"
            }\`}
          >
            Investments
          </button>
          )}
`;
code = code.replace('{/* Navigation Tabs */}', '{/* Navigation Tabs */}\n' + investmentButton);

// Hide restricted tabs for dependents
code = code.replace(/<button[^>]*onClick=\{\(\) => setActiveTab\("income"\)\}[^>]*>[\s\S]*?<\/button>/, '{!isDependent && $&}');
code = code.replace(/<button[^>]*onClick=\{\(\) => setActiveTab\("taxes"\)\}[^>]*>[\s\S]*?<\/button>/, '{!isDependent && $&}');

// Render new sections
const sectionRepl = `
          {activeTab === "overview" && <OverviewSection currentMonth={currentMonth} />}
          {activeTab === "household" && <HouseholdSettings />}
          {activeTab === "investments" && <InvestmentSection />}
`;
code = code.replace('{activeTab === "overview" && <OverviewSection currentMonth={currentMonth} />}', sectionRepl);

fs.writeFileSync('src/pages/Dashboard.tsx', code);
