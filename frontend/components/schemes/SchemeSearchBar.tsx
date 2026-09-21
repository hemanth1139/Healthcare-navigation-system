"use client";

import React from "react";
import { Search, X } from "lucide-react";

export interface SchemeSearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export const SchemeSearchBar: React.FC<SchemeSearchBarProps> = ({
  value,
  onChange,
  placeholder = "Search schemes by keyword, benefit, or department...",
}) => {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
        <Search className="w-4 h-4" />
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search government healthcare schemes"
        className="w-full font-body text-xs sm:text-sm text-[#0F172A] bg-white border border-[#F0FDFA] rounded-xl pl-10 pr-10 py-2.5 focus-ring shadow-2xs placeholder-[#64748B]/70"
      />

      {value && (
        <button
          onClick={() => onChange("")}
          type="button"
          aria-label="Clear search query"
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#64748B] hover:text-[#0F172A]"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
