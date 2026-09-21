"use client";

import React from "react";
import { SchemeQuery } from "@/types/scheme";
import { Card } from "@/components/ui/Card";
import { EvidenceSourceList } from "./EvidenceSourceList";
import { Sparkles, ShieldCheck, AlertCircle, Quote } from "lucide-react";

export const EligibilityResultCard: React.FC<{ result: SchemeQuery }> = ({ result }) => {
  const confidencePct = Math.round((result.confidence_score || 0.8) * 100);
  const isLowConfidence = result.is_low_confidence || confidencePct < 60;

  return (
    <Card className="p-5 sm:p-6 border-2 border-[#0D9488]/30 bg-white shadow-clinical-lg flex flex-col gap-4 animate-in fade-in zoom-in-98 duration-200 my-4">
      {/* Header Info: User Question & Confidence Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0FDFA] pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#0D9488] shrink-0" />
          <h3 className="font-heading font-bold text-sm text-[#0F172A]">
            AI Eligibility Synthesis & Retrieval
          </h3>
        </div>

        {/* Confidence Percentage Badge */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold w-fit ${
            isLowConfidence
              ? "bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]/30"
              : "bg-[#F0FDFA] text-[#0D9488] border border-[#0D9488]/20"
          }`}
          aria-label={`Match confidence: ${confidencePct}%`}
        >
          {isLowConfidence ? <AlertCircle className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
          <span>Match confidence: {confidencePct}%</span>
        </div>
      </div>

      {/* Quoted Original User Question */}
      <div className="flex items-start gap-2 text-xs text-[#64748B] bg-[#F8FAFC] p-3 rounded-xl border border-[#F0FDFA]">
        <Quote className="w-4 h-4 text-[#0D9488] shrink-0 rotate-180 mt-0.5" />
        <p className="italic font-medium text-[#0F172A]">&quot;{result.user_question}&quot;</p>
      </div>

      {/* Low Confidence Warning Framing if applicable */}
      {isLowConfidence && (
        <div className="bg-[#FEF3C7]/60 border border-[#F59E0B]/30 rounded-xl p-3 text-xs text-[#92400E] flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>We couldn&apos;t find an exact match — here is the closest information retrieved from official rules:</span>
        </div>
      )}

      {/* Main AI Response Text */}
      <div className="text-xs sm:text-sm text-[#0F172A] leading-relaxed font-body font-normal space-y-2">
        <p className="whitespace-pre-wrap">{result.ai_response}</p>
      </div>

      {/* Collapsible Retrieved Document Evidence Chunks */}
      <EvidenceSourceList chunks={result.retrieved_chunks} />

      {/* Permanent Medical & Government Disclaimer Strip */}
      <div className="bg-[#F0FDFA]/60 border border-[#0D9488]/20 rounded-xl p-3 flex items-start gap-2 text-xs text-[#64748B]">
        <ShieldCheck className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
        <p>
          <strong className="text-[#0F172A] font-semibold">Official Scheme Disclaimer:</strong> This is an AI-generated summary to help you understand your options. Confirm final eligibility guidelines directly with official scheme departments before applying.
        </p>
      </div>
    </Card>
  );
};
