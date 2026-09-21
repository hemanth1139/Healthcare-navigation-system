"use client";

import React from "react";
import { HistoryItem } from "@/types/history";
import { Card } from "@/components/ui/Card";
import {
  MessageSquare,
  Activity,
  FileText,
  Landmark,
  FolderUp,
  Clock,
  ChevronRight,
  Siren,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

export interface HistoryItemCardProps {
  item: HistoryItem;
  onOpenDrawer: (item: HistoryItem) => void;
}

const URGENCY_BADGE: Record<string, string> = {
  EMERGENCY: "bg-red-100 text-red-700 border-red-200",
  URGENT: "bg-orange-100 text-orange-700 border-orange-200",
  NON_URGENT: "bg-amber-100 text-amber-700 border-amber-200",
  ROUTINE: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const URGENCY_ICON: Record<string, React.ReactNode> = {
  EMERGENCY: <Siren className="w-3 h-3" />,
  URGENT: <AlertTriangle className="w-3 h-3" />,
  NON_URGENT: <Clock className="w-3 h-3" />,
  ROUTINE: <CheckCircle2 className="w-3 h-3" />,
};

export const HistoryItemCard: React.FC<HistoryItemCardProps> = ({
  item,
  onOpenDrawer,
}) => {
  const getIcon = () => {
    switch (item.type) {
      case "symptom_consultation":
        return <Activity className="w-5 h-5 text-[#0D9488]" />;
      case "scheme_query":
        return <Landmark className="w-5 h-5 text-[#0D9488]" />;
      case "document_upload":
        return <FolderUp className="w-5 h-5 text-[#0D9488]" />;
      default:
        return <MessageSquare className="w-5 h-5 text-[#0D9488]" />;
    }
  };

  const isEmergency = item.urgency === "EMERGENCY";

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
          isEmergency
            ? "border-red-400 bg-red-50 text-red-600"
            : "border-[#F0FDFA] text-[#0D9488]"
        }`}
      >
        {getIcon()}
      </div>

      <Card
        onClick={() => onOpenDrawer(item)}
        className={`p-4 sm:p-5 border-2 transition-all duration-150 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isEmergency
            ? "border-red-200 bg-red-50/30 shadow-xs"
            : "border-[#F0FDFA] bg-white hover:border-[#0D9488]/40 shadow-xs"
        }`}
      >
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0D9488] bg-[#F0FDFA] px-2.5 py-0.5 rounded-full">
              {item.type.replace(/_/g, " ")}
            </span>

            {/* Urgency badge for consultations */}
            {item.urgency && URGENCY_BADGE[item.urgency] && (
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${URGENCY_BADGE[item.urgency]}`}
              >
                {URGENCY_ICON[item.urgency]}
                {item.urgency.replace("_", " ")}
              </span>
            )}
          </div>

          <h3 className="font-heading font-bold text-sm sm:text-base text-[#0F172A] group-hover:text-[#0D9488] transition-colors leading-snug truncate mt-0.5">
            {item.title}
          </h3>

          <p className="text-xs text-[#64748B] line-clamp-1">{item.subtitle}</p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F0FDFA]">
          <span className="font-mono text-xs text-[#64748B]" title={fullDate}>
            <Clock className="w-3.5 h-3.5 inline mr-1 text-[#0D9488]" />
            {formattedTime}
          </span>

          <div className="flex items-center text-xs font-semibold text-[#0D9488] group-hover:translate-x-1 transition-transform">
            <span>Quick Preview</span>
            <ChevronRight className="w-4 h-4 ml-0.5" />
          </div>
        </div>
      </Card>
    </div>
  );
};
