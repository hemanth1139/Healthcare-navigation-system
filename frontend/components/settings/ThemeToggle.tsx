"use client";

import React from "react";
import { useTheme, ThemeMode } from "@/context/ThemeContext";
import { Sun, Moon, Monitor } from "lucide-react";

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const options: { id: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { id: "light", label: "Light Mode", icon: <Sun className="w-4 h-4" /> },
    { id: "dark", label: "Dark Mode", icon: <Moon className="w-4 h-4" /> },
    { id: "system", label: "System Preference", icon: <Monitor className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
          Interface Display Mode
        </span>
        <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
          Currently active theme: <strong className="text-[#0D9488] dark:text-[#14B8A6] capitalize">{resolvedTheme} Mode</strong>
        </p>
      </div>

      {/* Segmented Control */}
      <div className="flex items-center gap-1.5 bg-[#F8FAFC] dark:bg-[#020617] p-1.5 rounded-2xl border border-[#F0FDFA] dark:border-[#1E293B] w-fit">
        {options.map((opt) => {
          const isSelected = theme === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setTheme(opt.id)}
              type="button"
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer focus-ring ${
                isSelected
                  ? "bg-white dark:bg-[#0F172A] text-[#0D9488] dark:text-[#14B8A6] shadow-xs font-bold"
                  : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]"
              }`}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
