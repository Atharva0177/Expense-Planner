import React from "react";
import { useTheme } from "../contexts/ThemeContext";
import { Sun, Moon, Laptop } from "lucide-react";

export function ThemeToggle({ showLabels = false }: { showLabels?: boolean }) {
  const { theme, setTheme, isDark, toggleTheme } = useTheme();

  return (
    <div className="inline-flex items-center border border-[#1A1A1A] dark:border-[#555] bg-white dark:bg-[#1E1E1E] p-0.5 shadow-[2px_2px_0px_#1A1A1A] dark:shadow-[2px_2px_0px_#000]">
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`px-2 py-1 flex items-center gap-1 text-[9px] uppercase font-mono font-bold tracking-wider transition-colors ${
          theme === "light"
            ? "bg-[#1A1A1A] text-white dark:bg-white dark:text-[#1A1A1A]"
            : "text-[#666] dark:text-[#AAA] hover:text-[#1A1A1A] dark:hover:text-white"
        }`}
        title="Light Mode"
      >
        <Sun className="w-3 h-3" />
        {showLabels && <span>Light</span>}
      </button>

      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`px-2 py-1 flex items-center gap-1 text-[9px] uppercase font-mono font-bold tracking-wider transition-colors ${
          theme === "dark"
            ? "bg-[#1A1A1A] text-white dark:bg-white dark:text-[#1A1A1A]"
            : "text-[#666] dark:text-[#AAA] hover:text-[#1A1A1A] dark:hover:text-white"
        }`}
        title="Dark Mode"
      >
        <Moon className="w-3 h-3" />
        {showLabels && <span>Dark</span>}
      </button>

      <button
        type="button"
        onClick={() => setTheme("system")}
        className={`px-2 py-1 flex items-center gap-1 text-[9px] uppercase font-mono font-bold tracking-wider transition-colors ${
          theme === "system"
            ? "bg-[#1A1A1A] text-white dark:bg-white dark:text-[#1A1A1A]"
            : "text-[#666] dark:text-[#AAA] hover:text-[#1A1A1A] dark:hover:text-white"
        }`}
        title="System Match"
      >
        <Laptop className="w-3 h-3" />
        {showLabels && <span>Auto</span>}
      </button>
    </div>
  );
}

export function QuickThemeButton() {
  const { toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase font-mono font-bold tracking-widest border border-[#1A1A1A] dark:border-[#555] bg-white dark:bg-[#1E1E1E] text-[#1A1A1A] dark:text-[#F3F3F3] hover:bg-[#F5F2EB] dark:hover:bg-[#282828] transition-colors shadow-[2px_2px_0px_#1A1A1A] dark:shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {isDark ? (
        <>
          <Sun className="w-3 h-3 text-amber-400" />
          <span className="hidden sm:inline">Light</span>
        </>
      ) : (
        <>
          <Moon className="w-3 h-3 text-[#1A1A1A]" />
          <span className="hidden sm:inline">Dark</span>
        </>
      )}
    </button>
  );
}
