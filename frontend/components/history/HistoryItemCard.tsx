"use client";

import React from "react";
import { HistoryItem } from "@/types/history";
import { SeverityBadge } from "@/components/predictions/SeverityBadge";
import { Card } from "@/components/ui/Card";
import { MessageSquare, Activity, FileText, Landmark, Clock, ChevronRight } from "lucide-react";

export interface HistoryItemCardProps {
  item: HistoryItem;
  onOpenDrawer: (item: HistoryItem) => void;
}

export const HistoryItemCard: React.FC<HistoryItemCardProps> = ({
  item,
  onOpenDrawer,
}) => {
  const getIcon = () => {
    switch (item.type) {
      case "conversation":
        return <MessageSquare className="w-5 h-5 text-[#0F6E7A]" />;
      case "prediction":
        return <Activity className="w-5 h-5 text-[#0F6E7A]" />;
      case "record":
        return <FileText className="w-5 h-5 text-[#0F6E7A]" />;
      case "scheme_query":
        return <Landmark className="w-5 h-5 text-[#0F6E7A]" />;
      default:
        return <Activity className="w-5 h-5 text-[#0F6E7A]" />;
    }
  };

  const formattedTime = new Date(item.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const fullDate = new Date(item.timestamp).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="relative pl-6 sm:pl-8 group">
      {/* Timeline Node Icon Circle */}
      <div
        className={`absolute left-0 top-3.5 -translate-x-1/2 w-9 h-9 rounded-full flex items-center justify-center border-2 bg-white shadow-xs z-10 transition-transform group-hover:scale-110 ${
          item.severity === "emergency"
            ? "border-[#E5573F] bg-[#FDF0EE] text-[#E5573F]"
            : "border-[#E6F4F3] text-[#0F6E7A]"
        }`}
      >
        {getIcon()}
      </div>

      <Card
        onClick={() => onOpenDrawer(item)}
        className={`p-4 sm:p-5 border-2 transition-all duration-150 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          item.severity === "emergency"
            ? "border-[#E5573F]/40 bg-[#FDF0EE]/30 shadow-xs"
            : "border-[#E6F4F3] bg-white hover:border-[#0F6E7A]/40 shadow-xs"
        }`}
      >
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F6E7A] bg-[#E6F4F3] px-2.5 py-0.5 rounded-full">
              {item.type.replace("_", " ")}
            </span>

            {/* Inline Severity Badge Reused from Phase 5 */}
            {item.severity && (
              <SeverityBadge severity={item.severity} className="text-[10px] px-2 py-0.5" />
            )}
          </div>

          <h3 className="font-heading font-bold text-sm sm:text-base text-[#1E2A2E] group-hover:text-[#0F6E7A] transition-colors leading-snug truncate mt-0.5">
            {item.title}
          </h3>

          <p className="text-xs text-[#5C6B6E] line-clamp-1">{item.subtitle}</p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E6F4F3]">
          <span className="font-mono text-xs text-[#5C6B6E]" title={fullDate}>
            <Clock className="w-3.5 h-3.5 inline mr-1 text-[#0F6E7A]" />
            {formattedTime}
          </span>

          <div className="flex items-center text-xs font-semibold text-[#0F6E7A] group-hover:translate-x-1 transition-transform">
            <span>Quick Preview</span>
            <ChevronRight className="w-4 h-4 ml-0.5" />
          </div>
        </div>
      </Card>
    </div>
  );
};
