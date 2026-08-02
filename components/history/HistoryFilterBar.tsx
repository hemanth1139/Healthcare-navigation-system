"use client";

import React from "react";
import { HistoryTypeFilter, HistoryDateRange } from "@/types/history";
import { Filter, Calendar, MessageSquare, Activity, FileText, Landmark } from "lucide-react";

export interface HistoryFilterBarProps {
  selectedType: HistoryTypeFilter;
  onTypeChange: (type: HistoryTypeFilter) => void;
  dateRange: HistoryDateRange;
  onDateRangeChange: (range: HistoryDateRange) => void;
}

const TYPE_OPTIONS: { id: HistoryTypeFilter; label: string; icon: React.ReactNode }[] = [
  { id: "All", label: "All Activity", icon: <Filter className="w-3.5 h-3.5" /> },
  { id: "conversation", label: "Symptom Checks", icon: <MessageSquare className="w-3.5 h-3.5" /> },
  { id: "prediction", label: "Predictions", icon: <Activity className="w-3.5 h-3.5" /> },
  { id: "record", label: "Records", icon: <FileText className="w-3.5 h-3.5" /> },
  { id: "scheme_query", label: "Scheme Queries", icon: <Landmark className="w-3.5 h-3.5" /> },
];

export const HistoryFilterBar: React.FC<HistoryFilterBarProps> = ({
  selectedType,
  onTypeChange,
  dateRange,
  onDateRangeChange,
}) => {
  return (
    <div className="bg-white border-2 border-[#E6F4F3] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Type Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 flex-1">
        {TYPE_OPTIONS.map((opt) => {
          const isSelected = selectedType === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onTypeChange(opt.id)}
              type="button"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer focus-ring ${
                isSelected
                  ? "bg-[#0F6E7A] text-white shadow-2xs"
                  : "bg-white text-[#5C6B6E] hover:text-[#1E2A2E] border border-[#E6F4F3] hover:bg-[#E6F4F3]/50"
              }`}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Date Range Selector */}
      <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 border-[#E6F4F3] pt-2 sm:pt-0">
        <span className="text-xs font-semibold text-[#5C6B6E] flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-[#0F6E7A]" /> Range:
        </span>
        <select
          value={dateRange}
          onChange={(e) => onDateRangeChange(e.target.value as HistoryDateRange)}
          className="font-body text-xs text-[#1E2A2E] bg-[#F7FAFA] border border-[#E6F4F3] rounded-xl px-3 py-1.5 focus-ring cursor-pointer font-mono"
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>
    </div>
  );
};
