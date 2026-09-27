"use client";

import React, { useState, useEffect } from "react";
import { Search, X, Sparkles, Building2, Stethoscope, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface HospitalSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (query: string) => void;
}

const QUICK_SUGGESTIONS = [
  { label: "Government hospital", icon: Building2, type: "type" },
  { label: "Cardiology", icon: Stethoscope, type: "specialty" },
  { label: "Emergency Chennai", icon: Building2, type: "service" },
  { label: "Coimbatore", icon: MapPin, type: "location" },
  { label: "Madurai", icon: MapPin, type: "location" },
  { label: "Trichy", icon: MapPin, type: "location" },
  { label: "Salem", icon: MapPin, type: "location" },
];

export const HospitalSearchBar: React.FC<HospitalSearchBarProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
}) => {
  const [localInput, setLocalInput] = useState(searchQuery);

  useEffect(() => {
    setLocalInput(searchQuery);
  }, [searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit(localInput);
  };

  const handleClear = () => {
    setLocalInput("");
    onSearchChange("");
    onSearchSubmit("");
  };

  const handleSuggestionClick = (label: string) => {
    setLocalInput(label);
    onSearchChange(label);
    onSearchSubmit(label);
  };

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-[#0D9488] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={localInput}
            onChange={(e) => {
              setLocalInput(e.target.value);
              onSearchChange(e.target.value);
            }}
            placeholder="Search hospitals, specialties or Tamil Nadu locations (e.g. Government hospital, Cardiology Chennai, Madurai)..."
            className="w-full text-sm font-semibold text-[#0F172A] bg-white border-2 border-[#E2E8F0] focus:border-[#0D9488] focus:ring-4 focus:ring-teal-500/10 rounded-2xl pl-12 pr-10 py-3.5 shadow-xs transition-all outline-none"
          />
          {localInput && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="rounded-2xl px-6 py-3.5 font-bold shadow-xs shrink-0"
        >
          <Search className="w-4 h-4 mr-2" />
          <span>Search</span>
        </Button>
      </form>

      {/* Quick Search Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] shrink-0 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-[#0D9488]" />
          <span>Suggestions:</span>
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {QUICK_SUGGESTIONS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleSuggestionClick(item.label)}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-50 hover:bg-[#F0FDFA] text-slate-700 hover:text-[#0D9488] border border-slate-200 hover:border-[#0D9488]/40 font-medium text-xs transition-all cursor-pointer shrink-0"
            >
              <item.icon className="w-3 h-3 text-[#0D9488]" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
