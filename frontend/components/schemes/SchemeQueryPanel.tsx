"use client";

import React, { useEffect, useState } from "react";
import { SchemeQuery } from "@/types/scheme";
import { schemeApi } from "@/lib/schemeApi";
import { api, USE_MOCK_API } from "@/lib/api";
import { profileApi } from "@/lib/mockProfileData";
import { Button } from "@/components/ui/Button";
import { Sparkles, HelpCircle, ArrowRight, ClipboardCheck } from "lucide-react";
import { QuickEligibilityIntakeCard, QuickIntakeData } from "./QuickEligibilityIntakeCard";

export interface SchemeQueryPanelProps {
  onQueryResult: (result: SchemeQuery) => void;
  scopedSchemeId?: string;
  placeholder?: string;
}

const SAMPLE_PROMPTS = [
  "What schemes am I eligible for?",
  "Am I eligible for Ayushman Vaya Vandana if I am 70 years old?",
  "What is the family income limit for PM-JAY?",
  "Does Ayushman Bharat cover cosmetic surgeries?",
];

export const SchemeQueryPanel: React.FC<SchemeQueryPanelProps> = ({
  onQueryResult,
  scopedSchemeId,
  placeholder = "Ask about scheme eligibility or coverage, e.g., 'What schemes am I eligible for?'",
}) => {
  const [question, setQuestion] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const [showIntake, setShowIntake] = useState(false);
  const [gender, setGender] = useState<string | undefined>();

  useEffect(() => {
    let active = true;
    const loadGender = USE_MOCK_API
      ? profileApi.getRecord().then((record) => record.profile.gender)
      : api.get("/profile").then(({ data }) => data.gender ?? data.gender_identity);
    loadGender
      .then((profileGender) => {
        if (active && profileGender) setGender(profileGender);
      })
      .catch((error) => console.warn("Unable to load profile gender for scheme intake:", error));
    return () => { active = false; };
  }, []);

  const isOpenEndedQuery = (text: string) => {
    const lower = text.toLowerCase().trim();
    return [
      "what are the schemes am i eligible for",
      "what schemes am i eligible for",
      "which schemes am i eligible for",
      "am i eligible for any schemes",
      "what schemes can i get",
      "find schemes for me",
      "schemes for me",
      "am i eligible",
      "what am i eligible for",
    ].some((kw) => lower.includes(kw));
  };

  const handleQuerySubmit = async (textToQuery?: string, additionalInfo?: Record<string, any>) => {
    const q = (textToQuery || question).trim();
    if (!q || isQuerying) return;

    // If generic question and no intake info provided yet, prompt the user for intake
    if (isOpenEndedQuery(q) && !additionalInfo) {
      setShowIntake(true);
      return;
    }

    setIsQuerying(true);
    try {
      const { query } = await schemeApi.querySchemeEligibility(q, scopedSchemeId, additionalInfo);
      onQueryResult(query);
    } catch (err) {
      alert("Failed to query scheme eligibility. Please try again.");
    } finally {
      setIsQuerying(false);
    }
  };

  const handleIntakeSubmit = async (intakeData: QuickIntakeData) => {
    setShowIntake(false);
    const q = question.trim() || "What government healthcare schemes am I eligible for?";
    await handleQuerySubmit(q, {
      state: intakeData.state,
      age: intakeData.age,
      annual_income: intakeData.annual_income,
      employment_status: intakeData.employment_status,
      disability_status: intakeData.disability_status,
      pregnancy_status: intakeData.pregnancy_status,
    });
  };

  return (
    <div className="bg-gradient-to-br from-[#0D9488]/10 via-[#F0FDFA]/40 to-white border-2 border-[#0D9488]/30 rounded-2xl p-5 sm:p-6 shadow-clinical flex flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-[#0D9488] text-white flex items-center justify-center shrink-0 shadow-xs">
          <Sparkles className="w-5 h-5" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-[#0D9488] px-2.5 py-0.5 rounded-full">
              RAG AI Assistant
            </span>
          </div>
          <h2 className="font-heading font-bold text-base sm:text-lg text-[#0F172A] mt-0.5">
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
            className="w-full font-body text-xs sm:text-sm text-[#0F172A] bg-white border border-[#0D9488]/30 rounded-xl px-4 py-3 focus-ring shadow-xs placeholder-[#64748B]/70"
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

      {/* Inline Quick Eligibility Intake Card */}
      {showIntake && (
        <div className="pt-2">
          <QuickEligibilityIntakeCard
            isLoading={isQuerying}
            onSubmit={handleIntakeSubmit}
            onCancel={() => setShowIntake(false)}
            gender={gender}
          />
        </div>
      )}

      {/* Sample Prompt Chips */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-xs font-semibold text-[#64748B] flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5 text-[#0D9488]" /> Try asking:
        </span>
        {SAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => {
              setQuestion(prompt);
              handleQuerySubmit(prompt);
            }}
            type="button"
            className="text-[11px] font-medium text-[#0D9488] bg-white hover:bg-[#0D9488] hover:text-white border border-[#0D9488]/30 px-3 py-1 rounded-full transition-all cursor-pointer shadow-2xs"
          >
            &quot;{prompt}&quot;
          </button>
        ))}
      </div>
    </div>
  );
};
