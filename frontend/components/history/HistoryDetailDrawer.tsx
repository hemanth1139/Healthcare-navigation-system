"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { HistoryItem } from "@/types/history";
import { Button } from "@/components/ui/Button";
import {
  X,
  ArrowRight,
  MessageSquare,
  Activity,
  FileText,
  Landmark,
  Calendar,
  Siren,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FolderUp,
} from "lucide-react";

export interface HistoryDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  item: HistoryItem | null;
}

const URGENCY_COLOR: Record<string, string> = {
  EMERGENCY: "bg-red-100 text-red-700",
  URGENT: "bg-orange-100 text-orange-700",
  NON_URGENT: "bg-amber-100 text-amber-700",
  ROUTINE: "bg-emerald-100 text-emerald-700",
};

const URGENCY_ICON: Record<string, React.ReactNode> = {
  EMERGENCY: <Siren className="w-3.5 h-3.5" />,
  URGENT: <AlertTriangle className="w-3.5 h-3.5" />,
  NON_URGENT: <Clock className="w-3.5 h-3.5" />,
  ROUTINE: <CheckCircle2 className="w-3.5 h-3.5" />,
};

export const HistoryDetailDrawer: React.FC<HistoryDetailDrawerProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const formattedDate = new Date(item.timestamp).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const payload = item.detailsPayload;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
        <div className="w-screen max-w-md bg-white border-l-2 border-[#F0FDFA] shadow-clinical-lg pointer-events-auto flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
          {/* Top Header */}
          <div className="p-5 border-b border-[#F0FDFA] flex items-start justify-between gap-3 bg-[#F8FAFC]">
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0D9488] bg-[#F0FDFA] px-2.5 py-0.5 rounded-full">
                  {item.type.replace(/_/g, " ")}
                </span>
                {/* Urgency badge for consultations */}
                {item.urgency && URGENCY_COLOR[item.urgency] && (
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${URGENCY_COLOR[item.urgency]}`}
                  >
                    {URGENCY_ICON[item.urgency]}
                    {item.urgency.replace("_", " ")}
                  </span>
                )}
              </div>

              <h2 className="font-heading font-bold text-base text-[#0F172A] leading-snug mt-1">
                {item.title}
              </h2>

              <span className="text-xs font-mono text-[#64748B] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#0D9488]" /> {formattedDate}
              </span>
            </div>

            <button
              onClick={onClose}
              type="button"
              aria-label="Close detail drawer"
              className="p-1.5 rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-[#F0FDFA] focus-ring transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="p-5 flex-1 flex flex-col gap-5">
            {/* 1. Symptom Consultation Payload */}
            {item.type === "symptom_consultation" && payload && (
              <div className="bg-[#F0FDFA]/50 border border-[#0D9488]/20 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0D9488] uppercase">
                  <Activity className="w-4 h-4" /> Symptom Consultation Summary
                </div>

                <div className="flex flex-col gap-2">
                  {payload.primary_symptom && (
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">
                        Primary Symptom
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {payload.primary_symptom}
                      </p>
                    </div>
                  )}
                  {payload.specialist_recommended && (
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">
                        Recommended Specialist
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {payload.specialist_recommended}
                      </p>
                    </div>
                  )}
                  {payload.total_turns && (
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">
                        Conversation Turns
                      </p>
                      <p className="text-xs text-slate-700">{payload.total_turns} exchanges</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. Scheme Query Payload */}
            {item.type === "scheme_query" && payload && (
              <div className="bg-[#F8FAFC] border border-[#F0FDFA] rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0D9488] uppercase">
                  <Landmark className="w-4 h-4" /> RAG Scheme Eligibility Query
                </div>

                {payload.scheme_name && (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase mb-0.5">
                      Scheme
                    </p>
                    <p className="text-xs font-semibold text-slate-800">{payload.scheme_name}</p>
                  </div>
                )}

                {payload.user_question && (
                  <div className="flex flex-col gap-1 text-xs">
                    <span className="font-semibold text-[#64748B]">Question Asked:</span>
                    <p className="italic font-medium text-[#0F172A] bg-white p-2.5 rounded-xl border border-[#F0FDFA]">
                      &quot;{payload.user_question}&quot;
                    </p>
                  </div>
                )}

                {payload.ai_answer_excerpt && (
                  <div className="flex flex-col gap-1 text-xs">
                    <span className="font-semibold text-[#64748B]">Assessment Summary:</span>
                    <p className="text-[#0F172A] bg-white p-2.5 rounded-xl border border-[#F0FDFA]">
                      {payload.ai_answer_excerpt}
                    </p>
                  </div>
                )}

                {payload.overall_status && (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase mb-0.5">
                      Overall Status
                    </p>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      {payload.overall_status.replace(/_/g, " ")}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 3. Document Upload Payload */}
            {item.type === "document_upload" && payload && (
              <div className="bg-[#F8FAFC] border border-[#F0FDFA] rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0D9488] uppercase">
                  <FolderUp className="w-4 h-4" /> Eligibility Document
                </div>

                <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-100 p-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-teal-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      {payload.file_name || "Uploaded Document"}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {payload.document_type_label}
                      {payload.scheme_name ? ` • ${payload.scheme_name}` : ""}
                    </p>
                    {payload.processing_status && (
                      <span className="text-[10px] font-bold uppercase text-teal-600">
                        Status: {payload.processing_status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Generic: if none of above match, show subtitle */}
            {!["symptom_consultation", "scheme_query", "document_upload"].includes(item.type) && (
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2">
                  <MessageSquare className="w-4 h-4" /> Summary
                </div>
                <p className="text-xs text-slate-700">{item.subtitle}</p>
              </div>
            )}
          </div>

          {/* Bottom Action CTA Link */}
          <div className="p-5 border-t border-[#F0FDFA] bg-[#F8FAFC]">
            <Link href={item.linkTo} onClick={onClose} className="w-full block">
              <Button variant="primary" size="lg" fullWidth>
                <span>View Full Details</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
