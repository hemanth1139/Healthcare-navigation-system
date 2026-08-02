"use client";

import React from "react";
import { HealthTip } from "@/types/healthTip";
import { HealthTipCard } from "./HealthTipCard";
import { Sparkles } from "lucide-react";

export interface HealthTipGridProps {
  tips: HealthTip[];
}

export const HealthTipGrid: React.FC<HealthTipGridProps> = ({ tips }) => {
  if (tips.length === 0) {
    return (
      <div className="bg-white border-2 border-dashed border-[#E6F4F3] rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3 my-4">
        <div className="w-12 h-12 rounded-2xl bg-[#E6F4F3] text-[#0F6E7A] flex items-center justify-center">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="font-heading font-bold text-base text-[#1E2A2E]">
          No health advisories found in this category
        </h3>
        <p className="text-xs text-[#5C6B6E] max-w-sm">
          Select &quot;All&quot; to review all general wellness and seasonal prevention tips.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 my-2">
      {tips.map((tip) => (
        <HealthTipCard key={tip.tip_id} tip={tip} />
      ))}
    </div>
  );
};
