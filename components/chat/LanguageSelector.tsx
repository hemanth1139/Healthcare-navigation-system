"use client";

import React, { useState } from "react";
import { Globe, ChevronDown } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "@/lib/mockChatData";
import { LanguageOption } from "@/types/chat";

export interface LanguageSelectorProps {
  currentLanguage: string;
  onSelectLanguage: (langCode: string) => void;
  compact?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onSelectLanguage,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const currentObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        aria-expanded={isOpen}
        aria-label="Select conversation language"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#E6F4F3] border border-[#E6F4F3] text-xs font-semibold text-[#0F6E7A] transition-colors focus-ring cursor-pointer shadow-xs ${
          compact ? "text-[11px] px-2 py-1" : ""
        }`}
      >
        <Globe className="w-3.5 h-3.5 text-[#0F6E7A]" />
        <span>{currentObj.name}</span>
        <span className="text-[10px] text-[#5C6B6E] font-normal">({currentObj.nativeName})</span>
        <ChevronDown className={`w-3.5 h-3.5 text-[#5C6B6E] transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-clinical-lg border-2 border-[#E6F4F3] py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 border-b border-[#E6F4F3] text-[10px] font-semibold text-[#5C6B6E] uppercase tracking-wider">
            IndicTrans2 Languages
          </div>

          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                onSelectLanguage(lang.code);
                setIsOpen(false);
              }}
              type="button"
              className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer ${
                currentLanguage === lang.code
                  ? "bg-[#E6F4F3] font-bold text-[#0F6E7A]"
                  : "text-[#1E2A2E] hover:bg-[#F7FAFA]"
              }`}
            >
              <span>{lang.name}</span>
              <span className="text-[11px] font-mono text-[#5C6B6E]">{lang.nativeName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
