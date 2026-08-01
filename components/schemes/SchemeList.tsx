"use client";

import React from "react";
import { GovernmentScheme } from "@/types/scheme";
import { SchemeCard } from "./SchemeCard";
import { SearchX } from "lucide-react";

export interface SchemeListProps {
  schemes: GovernmentScheme[];
  onResetFilters?: () => void;
}

export const SchemeList: React.FC<SchemeListProps> = ({
  schemes,
  onResetFilters,
}) => {
  if (schemes.length === 0) {
    return (
      <div className="bg-white border-2 border-dashed border-[#E6F4F3] rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3 my-4">
        <div className="w-12 h-12 rounded-2xl bg-[#E6F4F3] text-[#0F6E7A] flex items-center justify-center">
          <SearchX className="w-6 h-6" />
        </div>
        <h3 className="font-heading font-bold text-base text-[#1E2A2E]">
          No schemes match your search criteria
        </h3>
        <p className="text-xs text-[#5C6B6E] max-w-sm">
          Try adjusting your keyword query or switching the department filter chip to explore all available government benefits.
        </p>

        {onResetFilters && (
          <button
            onClick={onResetFilters}
            type="button"
            className="text-xs font-bold text-[#0F6E7A] hover:underline cursor-pointer mt-1"
          >
            Clear Filters & Show All Schemes
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 my-2">
      {schemes.map((sch) => (
        <SchemeCard key={sch.scheme_id} scheme={sch} />
      ))}
    </div>
  );
};
