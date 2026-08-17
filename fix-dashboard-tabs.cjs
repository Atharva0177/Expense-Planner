const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// The string we injected earlier
const badInjection = `        {/* Navigation Tabs */}
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
        <div className="flex gap-4 mb-6 md:mb-8 shrink-0 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">`;

const goodInjection = `        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-6 md:mb-8 shrink-0 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
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
          )}`;

code = code.replace(badInjection, goodInjection);
fs.writeFileSync('src/pages/Dashboard.tsx', code);
