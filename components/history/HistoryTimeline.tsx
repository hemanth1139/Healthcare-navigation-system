"use client";

import React from "react";
import { HistoryItem } from "@/types/history";
import { HistoryItemCard } from "./HistoryItemCard";
import { History, Calendar } from "lucide-react";

export interface HistoryTimelineProps {
  items: HistoryItem[];
  onOpenDrawer: (item: HistoryItem) => void;
}

export const HistoryTimeline: React.FC<HistoryTimelineProps> = ({
  items,
  onOpenDrawer,
}) => {
  if (items.length === 0) {
    return (
      <div className="bg-white border-2 border-dashed border-[#E6F4F3] rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3 my-4">
        <div className="w-12 h-12 rounded-2xl bg-[#E6F4F3] text-[#0F6E7A] flex items-center justify-center">
          <History className="w-6 h-6" />
        </div>
        <h3 className="font-heading font-bold text-base text-[#1E2A2E]">
          No health activity records found in this range
        </h3>
        <p className="text-xs text-[#5C6B6E] max-w-sm">
          Try expanding your date range filter or select &quot;All Activity&quot; to review your full health history.
        </p>
      </div>
    );
  }

  // Group items by relativeGroup
  const groups: { [key: string]: HistoryItem[] } = {
    Today: [],
    Yesterday: [],
    "This Week": [],
    Earlier: [],
  };

  items.forEach((item) => {
    if (groups[item.relativeGroup]) {
      groups[item.relativeGroup].push(item);
    } else {
      groups["Earlier"].push(item);
    }
  });

  return (
    <div className="relative flex flex-col gap-8 my-4 max-w-3xl mx-auto">
      {/* Continuous Vertical Timeline Track Line */}
      <div className="absolute left-[18px] top-6 bottom-6 w-0.5 bg-[#E6F4F3] pointer-events-none z-0" />

      {Object.entries(groups).map(([groupName, groupItems]) => {
        if (groupItems.length === 0) return null;

        return (
          <div key={groupName} className="flex flex-col gap-4 relative z-10">
            {/* Relative Date Group Heading Header */}
            <div className="flex items-center gap-2 bg-[#F7FAFA] border border-[#E6F4F3] px-3.5 py-1.5 rounded-xl w-fit shadow-2xs">
              <Calendar className="w-4 h-4 text-[#0F6E7A]" />
              <h2 className="font-heading font-bold text-xs uppercase tracking-wider text-[#1E2A2E]">
                {groupName}
              </h2>
              <span className="text-[10px] font-mono text-[#0F6E7A] bg-[#E6F4F3] px-2 py-0.5 rounded-full font-bold">
                {groupItems.length}
              </span>
            </div>

            {/* Timeline Cards Stack */}
            <div className="flex flex-col gap-4">
              {groupItems.map((item) => (
                <HistoryItemCard
                  key={item.id}
                  item={item}
                  onOpenDrawer={onOpenDrawer}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
