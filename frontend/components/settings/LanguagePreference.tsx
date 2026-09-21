"use client";

import React, { useState } from "react";
import { SUPPORTED_LANGUAGES } from "@/lib/mockChatData";
import { Globe, Check } from "lucide-react";

export const LanguagePreference: React.FC = () => {
  const [selectedLang, setSelectedLang] = useState("en");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = (code: string) => {
    setSelectedLang(code);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-1.5">
          <Globe className="w-4 h-4 text-[#0D9488] dark:text-[#14B8A6]" />
          Default Application & Triage Language
        </label>
        <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
          This sets your primary language for AI symptom triage checks, voice-to-text input, and government scheme eligibility responses.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isSelected = selectedLang === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => handleChange(lang.code)}
              type="button"
              className={`p-3 rounded-xl border-2 transition-all flex items-center justify-between text-left cursor-pointer focus-ring ${
                isSelected
                  ? "bg-[#F0FDFA] dark:bg-[#0D9488]/20 border-[#0D9488] font-bold text-[#0D9488] dark:text-[#14B8A6]"
                  : "bg-[#F8FAFC] dark:bg-[#020617] border-[#F0FDFA] dark:border-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] hover:border-[#0D9488]/30"
              }`}
            >
              <div className="flex flex-col">
                <span className="text-xs">{lang.name}</span>
                <span className="text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8]">
                  {lang.nativeName}
                </span>
              </div>
              {isSelected && <Check className="w-4 h-4 text-[#0D9488] dark:text-[#14B8A6]" />}
            </button>
          );
        })}
      </div>

      {savedSuccess && (
        <span className="text-xs font-semibold text-[#0D9488] dark:text-[#14B8A6] bg-[#F0FDFA] dark:bg-[#0D9488]/20 px-3 py-1 rounded-lg w-fit animate-in fade-in">
          ✓ Default language preference updated!
        </span>
      )}
    </div>
  );
};
