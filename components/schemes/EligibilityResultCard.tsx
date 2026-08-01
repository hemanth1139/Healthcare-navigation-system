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
    <Card className="p-5 sm:p-6 border-2 border-[#0F6E7A]/30 bg-white shadow-clinical-lg flex flex-col gap-4 animate-in fade-in zoom-in-98 duration-200 my-4">
      {/* Header Info: User Question & Confidence Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E6F4F3] pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#0F6E7A] shrink-0" />
          <h3 className="font-heading font-bold text-sm text-[#1E2A2E]">
            AI Eligibility Synthesis & Retrieval
          </h3>
        </div>

        {/* Confidence Percentage Badge */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold w-fit ${
            isLowConfidence
              ? "bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]/30"
              : "bg-[#E6F4F3] text-[#0F6E7A] border border-[#0F6E7A]/20"
          }`}
          aria-label={`Match confidence: ${confidencePct}%`}
        >
          {isLowConfidence ? <AlertCircle className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
          <span>Match confidence: {confidencePct}%</span>
        </div>
      </div>

      {/* Quoted Original User Question */}
      <div className="flex items-start gap-2 text-xs text-[#5C6B6E] bg-[#F7FAFA] p-3 rounded-xl border border-[#E6F4F3]">
        <Quote className="w-4 h-4 text-[#0F6E7A] shrink-0 rotate-180 mt-0.5" />
        <p className="italic font-medium text-[#1E2A2E]">&quot;{result.user_question}&quot;</p>
      </div>

      {/* Low Confidence Warning Framing if applicable */}
      {isLowConfidence && (
        <div className="bg-[#FEF3C7]/60 border border-[#F59E0B]/30 rounded-xl p-3 text-xs text-[#92400E] flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>We couldn&apos;t find an exact match — here is the closest information retrieved from official rules:</span>
        </div>
      )}

      {/* Main AI Response Text */}
      <div className="text-xs sm:text-sm text-[#1E2A2E] leading-relaxed font-body font-normal space-y-2">
        <p className="whitespace-pre-wrap">{result.ai_response}</p>
      </div>

      {/* Collapsible Retrieved Document Evidence Chunks */}
      <EvidenceSourceList chunks={result.retrieved_chunks} />

      {/* Permanent Medical & Government Disclaimer Strip */}
      <div className="bg-[#E6F4F3]/60 border border-[#0F6E7A]/20 rounded-xl p-3 flex items-start gap-2 text-xs text-[#5C6B6E]">
        <ShieldCheck className="w-4 h-4 text-[#0F6E7A] shrink-0 mt-0.5" />
        <p>
          <strong className="text-[#1E2A2E] font-semibold">Official Scheme Disclaimer:</strong> This is an AI-generated summary to help you understand your options. Confirm final eligibility guidelines directly with official scheme departments before applying.
        </p>
      </div>
    </Card>
  );
};
