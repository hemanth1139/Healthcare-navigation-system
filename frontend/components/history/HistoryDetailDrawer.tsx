"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { HistoryItem } from "@/types/history";
import { SeverityBadge } from "@/components/predictions/SeverityBadge";
import { Button } from "@/components/ui/Button";
import {
  X,
  ArrowRight,
  MessageSquare,
  Activity,
  FileText,
  Landmark,
  Download,
  Calendar,
  Sparkles,
} from "lucide-react";

export interface HistoryDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  item: HistoryItem | null;
}

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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Drawer Container (Desktop: Right slide-over, Mobile: Bottom sheet) */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
        <div className="w-screen max-w-md bg-white border-l-2 border-[#E6F4F3] shadow-clinical-lg pointer-events-auto flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
          {/* Top Header */}
          <div className="p-5 border-b border-[#E6F4F3] flex items-start justify-between gap-3 bg-[#F7FAFA]">
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F6E7A] bg-[#E6F4F3] px-2.5 py-0.5 rounded-full">
                  {item.type.replace("_", " ")}
                </span>
                {item.severity && <SeverityBadge severity={item.severity} />}
              </div>

              <h2 className="font-heading font-bold text-base text-[#1E2A2E] leading-snug mt-1">
                {item.title}
              </h2>

              <span className="text-xs font-mono text-[#5C6B6E] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#0F6E7A]" /> {formattedDate}
              </span>
            </div>

            <button
              onClick={onClose}
              type="button"
              aria-label="Close detail drawer"
              className="p-1.5 rounded-xl text-[#5C6B6E] hover:text-[#1E2A2E] hover:bg-[#E6F4F3] focus-ring transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body Condensed Summary */}
          <div className="p-5 flex-1 flex flex-col gap-5">
            {/* 1. Prediction Payload */}
            {item.type === "prediction" && item.detailsPayload && (
              <div className="bg-[#E6F4F3]/50 border border-[#0F6E7A]/20 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0F6E7A] uppercase">
                  <Activity className="w-4 h-4" /> Diagnostic Differential Match
                </div>

                <div className="flex flex-col gap-1">
                  <h3 className="font-heading font-bold text-base text-[#1E2A2E]">
                    {item.detailsPayload.disease_name}
                  </h3>
                  {item.detailsPayload.confidence_score && (
                    <span className="font-mono text-xs font-semibold text-[#0F6E7A]">
                      Confidence Score: {Math.round(item.detailsPayload.confidence_score * 100)}%
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 2. Record Payload */}
            {item.type === "record" && (
              <div className="bg-[#F7FAFA] border border-[#E6F4F3] rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0F6E7A] uppercase">
                  <FileText className="w-4 h-4" /> Medical Document Metadata
                </div>

                {item.thumbnail && (
                  <div className="w-full h-40 rounded-xl overflow-hidden border border-[#E6F4F3]">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-[#5C6B6E] font-mono pt-1">
                  <span>Category: {item.detailsPayload?.category || "Medical Record"}</span>
                  <span>Type: {item.detailsPayload?.file_type?.toUpperCase() || "PDF"}</span>
                </div>
              </div>
            )}

            {/* 3. Conversation Payload */}
            {item.type === "conversation" && item.detailsPayload && (
              <div className="bg-[#F7FAFA] border border-[#E6F4F3] rounded-2xl p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0F6E7A] uppercase">
                  <MessageSquare className="w-4 h-4" /> Chat Transcript Summary
                </div>
                <p className="text-xs text-[#1E2A2E] leading-relaxed italic bg-white p-3 rounded-xl border border-[#E6F4F3]">
                  &quot;{item.detailsPayload.last_message_excerpt}&quot;
                </p>
              </div>
            )}

            {/* 4. Scheme Query Payload */}
            {item.type === "scheme_query" && item.detailsPayload && (
              <div className="bg-[#F7FAFA] border border-[#E6F4F3] rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0F6E7A] uppercase">
                  <Landmark className="w-4 h-4" /> RAG Scheme Question
                </div>

                <div className="flex flex-col gap-1 text-xs">
                  <span className="font-semibold text-[#5C6B6E]">Question Asked:</span>
                  <p className="italic font-medium text-[#1E2A2E] bg-white p-2.5 rounded-xl border border-[#E6F4F3]">
                    &quot;{item.detailsPayload.user_question}&quot;
                  </p>
                </div>

                <div className="flex flex-col gap-1 text-xs">
                  <span className="font-semibold text-[#5C6B6E]">Synthesized Answer:</span>
                  <p className="text-[#1E2A2E] bg-white p-2.5 rounded-xl border border-[#E6F4F3]">
                    {item.detailsPayload.ai_answer_excerpt}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action CTA Link */}
          <div className="p-5 border-t border-[#E6F4F3] bg-[#F7FAFA]">
            <Link href={item.linkTo} onClick={onClose} className="w-full block">
              <Button variant="primary" size="lg" fullWidth>
                <span>View Full Page & Details</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
