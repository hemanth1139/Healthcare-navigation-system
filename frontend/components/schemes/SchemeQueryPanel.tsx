"use client";

import React, { useState } from "react";
import { SchemeQuery } from "@/types/scheme";
import { schemeApi } from "@/lib/mockSchemeData";
import { Button } from "@/components/ui/Button";
import { Sparkles, HelpCircle, ArrowRight } from "lucide-react";

export interface SchemeQueryPanelProps {
  onQueryResult: (result: SchemeQuery) => void;
  scopedSchemeId?: string;
  placeholder?: string;
}

const SAMPLE_PROMPTS = [
  "Am I eligible for Ayushman Vaya Vandana if I am 70 years old?",
  "What is the family income limit for PM-JAY?",
  "Does Ayushman Bharat cover cosmetic surgeries?",
];

export const SchemeQueryPanel: React.FC<SchemeQueryPanelProps> = ({
  onQueryResult,
  scopedSchemeId,
  placeholder = "Ask about scheme eligibility or coverage, e.g., 'Am I eligible for Ayushman Bharat at age 70?'",
}) => {
  const [question, setQuestion] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);

  const handleQuerySubmit = async (textToQuery?: string) => {
    const q = textToQuery || question;
    if (!q.trim() || isQuerying) return;

    setIsQuerying(true);
    try {
      const res = await schemeApi.querySchemeEligibility(q, scopedSchemeId);
      onQueryResult(res);
    } catch (err) {
      alert("Failed to query scheme eligibility. Please try again.");
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#0F6E7A]/10 via-[#E6F4F3]/40 to-white border-2 border-[#0F6E7A]/30 rounded-2xl p-5 sm:p-6 shadow-clinical flex flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-[#0F6E7A] text-white flex items-center justify-center shrink-0 shadow-xs">
          <Sparkles className="w-5 h-5" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-[#0F6E7A] px-2.5 py-0.5 rounded-full">
              RAG AI Assistant
            </span>
          </div>
          <h2 className="font-heading font-bold text-base sm:text-lg text-[#1E2A2E] mt-0.5">
            Ask Any Healthcare Scheme Question
          </h2>
        </div>
      </div>

      {/* Input Box */}
      <div className="flex flex-col sm:flex-row items-stretch gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleQuerySubmit();
            }}
            placeholder={placeholder}
            aria-label="Ask about government scheme eligibility"
            className="w-full font-body text-xs sm:text-sm text-[#1E2A2E] bg-white border border-[#0F6E7A]/30 rounded-xl px-4 py-3 focus-ring shadow-xs placeholder-[#5C6B6E]/70"
          />
        </div>

        <Button
          onClick={() => handleQuerySubmit()}
          disabled={!question.trim() || isQuerying}
          isLoading={isQuerying}
          variant="primary"
          size="md"
          className="shrink-0 px-6 py-3 min-h-[46px]"
        >
          <span>Ask AI</span>
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>

      {/* Sample Prompt Chips */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-xs font-semibold text-[#5C6B6E] flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5 text-[#0F6E7A]" /> Try asking:
        </span>
        {SAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => {
              setQuestion(prompt);
              handleQuerySubmit(prompt);
            }}
            type="button"
            className="text-[11px] font-medium text-[#0F6E7A] bg-white hover:bg-[#0F6E7A] hover:text-white border border-[#0F6E7A]/30 px-3 py-1 rounded-full transition-all cursor-pointer shadow-2xs"
          >
            &quot;{prompt}&quot;
          </button>
        ))}
      </div>
    </div>
  );
};
