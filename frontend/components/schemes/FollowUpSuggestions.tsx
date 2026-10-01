"use client";

import React from "react";
import { Lightbulb, ArrowRight } from "lucide-react";

interface FollowUpSuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

export const FollowUpSuggestions: React.FC<FollowUpSuggestionsProps> = ({
  suggestions,
  onSelect,
}) => {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Suggested follow-up questions:
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelect(suggestion)}
            type="button"
            className="flex items-center gap-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-[#0D9488]/10 hover:text-[#0D9488] dark:hover:text-[#14B8A6] border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg transition-all cursor-pointer group"
          >
            <span className="flex-1">{suggestion}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0D9488] dark:group-hover:text-[#14B8A6] transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
};
