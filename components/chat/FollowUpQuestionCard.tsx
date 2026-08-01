"use client";

import React, { useState } from "react";
import { FollowUpQuestion, QuickReplyOption } from "@/types/chat";
import { HelpCircle, CheckCircle2 } from "lucide-react";

export interface FollowUpQuestionCardProps {
  question: FollowUpQuestion;
  onSelectOption: (option: QuickReplyOption) => void;
  disabled?: boolean;
}

export const FollowUpQuestionCard: React.FC<FollowUpQuestionCardProps> = ({
  question,
  onSelectOption,
  disabled = false,
}) => {
  const [selectedId, setSelectedId] = useState<string | undefined>(question.selectedOptionId);
  const isAnswered = question.isAnswered || !!selectedId || disabled;

  const handleChipClick = (option: QuickReplyOption) => {
    if (isAnswered) return;
    setSelectedId(option.id);
    onSelectOption(option);
  };

  return (
    <div className="bg-[#E6F4F3]/60 border border-[#0F6E7A]/20 rounded-2xl p-3.5 sm:p-4 my-2 flex flex-col gap-3 max-w-md shadow-xs">
      <div className="flex items-center gap-2">
        <HelpCircle className="w-4 h-4 text-[#0F6E7A] shrink-0" />
        <h4 className="font-heading font-semibold text-xs text-[#1E2A2E]">
          {question.question_text}
        </h4>
      </div>

      {question.options && question.options.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {question.options.map((opt) => {
            const isSelected = selectedId === opt.id;

            return (
              <button
                key={opt.id}
                onClick={() => handleChipClick(opt)}
                disabled={isAnswered}
                type="button"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer focus-ring ${
                  isSelected
                    ? "bg-[#0F6E7A] text-white shadow-sm"
                    : isAnswered
                    ? "bg-white/60 text-[#5C6B6E] opacity-60 cursor-not-allowed border border-[#E6F4F3]"
                    : "bg-white hover:bg-[#0F6E7A] text-[#0F6E7A] hover:text-white border border-[#0F6E7A]/30 hover:border-[#0F6E7A] shadow-2xs"
                }`}
              >
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {question.allowFreeText && !isAnswered && (
        <span className="text-[11px] text-[#5C6B6E]">
          Or type your detailed response below.
        </span>
      )}
    </div>
  );
};
