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
        <span className="text-xs font-semibold text-[#1E2A2E] dark:text-[#F7FAFA]">
          Interface Display Mode
        </span>
        <p className="text-xs text-[#5C6B6E] dark:text-[#A3B2B5]">
          Currently active theme: <strong className="text-[#0F6E7A] dark:text-[#25A0B0] capitalize">{resolvedTheme} Mode</strong>
        </p>
      </div>

      {/* Segmented Control */}
      <div className="flex items-center gap-1.5 bg-[#F7FAFA] dark:bg-[#121C1F] p-1.5 rounded-2xl border border-[#E6F4F3] dark:border-[#25363B] w-fit">
        {options.map((opt) => {
          const isSelected = theme === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setTheme(opt.id)}
              type="button"
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer focus-ring ${
                isSelected
                  ? "bg-white dark:bg-[#1A262A] text-[#0F6E7A] dark:text-[#25A0B0] shadow-xs font-bold"
                  : "text-[#5C6B6E] dark:text-[#A3B2B5] hover:text-[#1E2A2E] dark:hover:text-[#F7FAFA]"
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
