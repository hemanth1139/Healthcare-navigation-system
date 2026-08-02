"use client";

import React from "react";
import { Filter, LayoutGrid, List, ArrowUpDown } from "lucide-react";

export interface RecordFilterBarProps {
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  totalCount: number;
}

export const RecordFilterBar: React.FC<RecordFilterBarProps> = ({
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  totalCount,
}) => {
  return (
    <div className="bg-white border-2 border-[#E6F4F3] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Category Dropdown */}
      <div className="flex flex-wrap items-center gap-3 flex-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#5C6B6E]">
          <Filter className="w-4 h-4 text-[#0F6E7A]" />
          <span>Category:</span>
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="font-body text-xs text-[#1E2A2E] bg-[#F7FAFA] border border-[#E6F4F3] rounded-xl px-3 py-2 focus-ring cursor-pointer"
        >
          <option value="All">All Categories</option>
          <option value="Prescription">Prescriptions</option>
          <option value="Lab Report">Lab Reports</option>
          <option value="Scan / Imaging">Scans & Radiology</option>
          <option value="Discharge Summary">Discharge Summaries</option>
          <option value="Other">Other Documents</option>
        </select>

        {/* Date Sort */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#5C6B6E] ml-0 sm:ml-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-[#0F6E7A]" />
          <span>Sort:</span>
        </div>

        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="font-body text-xs text-[#1E2A2E] bg-[#F7FAFA] border border-[#E6F4F3] rounded-xl px-3 py-2 focus-ring cursor-pointer font-mono"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      {/* Right: Total Count & Grid/List View Switcher */}
      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E6F4F3]">
        <span className="text-xs font-mono font-bold text-[#0F6E7A] bg-[#E6F4F3] px-2.5 py-1 rounded-full">
          {totalCount} Records
        </span>

        <div className="flex items-center gap-1 bg-[#F7FAFA] p-1 rounded-xl border border-[#E6F4F3]">
          <button
            onClick={() => onViewModeChange("grid")}
            type="button"
            aria-label="Switch to grid view"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === "grid"
                ? "bg-white text-[#0F6E7A] shadow-2xs"
                : "text-[#5C6B6E] hover:text-[#1E2A2E]"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>

          <button
            onClick={() => onViewModeChange("list")}
            type="button"
            aria-label="Switch to list view"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === "list"
                ? "bg-white text-[#0F6E7A] shadow-2xs"
                : "text-[#5C6B6E] hover:text-[#1E2A2E]"
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
