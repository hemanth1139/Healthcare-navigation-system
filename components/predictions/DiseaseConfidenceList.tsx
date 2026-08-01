"use client";

import React, { useEffect, useState } from "react";
import { DifferentialDisease } from "@/types/prediction";
import { Card } from "@/components/ui/Card";
import { Sparkles, CheckCircle2 } from "lucide-react";

export interface DiseaseConfidenceListProps {
  differential: DifferentialDisease[];
}

export const DiseaseConfidenceList: React.FC<DiseaseConfidenceListProps> = ({
  differential,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Card className="p-5 sm:p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between border-b border-[#E6F4F3] pb-3">
        <div>
          <h2 className="font-heading font-bold text-base text-[#1E2A2E]">
            Differential Diagnosis & Confidence
          </h2>
          <p className="text-xs text-[#5C6B6E]">
            Ranked list of potential matching conditions based on clinical triage inputs
          </p>
        </div>

        <span className="text-xs font-mono font-semibold text-[#0F6E7A] bg-[#E6F4F3] px-2.5 py-1 rounded-full hidden sm:inline">
          Ranked Differential
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {differential.map((item, idx) => {
          const percentage = Math.round(item.confidence_score * 100);
          const isTop = item.is_top_match || idx === 0;

          return (
            <div
              key={item.disease_name}
              className={`p-4 rounded-xl border transition-all duration-200 ${
                isTop
                  ? "bg-[#E6F4F3]/60 border-2 border-[#0F6E7A]/40 shadow-xs"
                  : "bg-white border-[#E6F4F3] hover:border-[#0F6E7A]/20"
              }`}
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                <div className="flex items-center gap-2">
                  {isTop && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white bg-[#0F6E7A] px-2 py-0.5 rounded-full">
                      <Sparkles className="w-3 h-3" /> Most Likely Match
                    </span>
                  )}
                  <h3 className="font-heading font-bold text-base text-[#1E2A2E]">
                    {item.disease_name}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#5C6B6E]">Confidence:</span>
                  <span className="font-mono font-bold text-base text-[#0F6E7A]">
                    {percentage}%
                  </span>
                </div>
              </div>

              {/* Description */}
              {item.description && (
                <p className="text-xs text-[#5C6B6E] mb-3 leading-relaxed">
                  {item.description}
                </p>
              )}

              {/* Animated Visual Bar */}
              <div
                className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200/60"
                aria-label={`${percentage}% confidence match for ${item.disease_name}`}
              >
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    isTop
                      ? "bg-gradient-to-r from-[#0F6E7A] to-[#25A0B0]"
                      : "bg-[#0F6E7A]/60"
                  }`}
                  style={{ width: mounted ? `${percentage}%` : "0%" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
