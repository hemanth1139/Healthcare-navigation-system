"use client";

import React, { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface HospitalSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (query: string) => void;
}

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
    </div>
  );
};
