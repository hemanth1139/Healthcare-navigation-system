"use client";

import React from "react";
import { HealthTipCategory } from "@/types/healthTip";

export interface HealthTipFilterChipsProps {
  selectedCategory: HealthTipCategory | "All";
  onSelectCategory: (cat: HealthTipCategory | "All") => void;
  showChronicCategory?: boolean;
}

export const HealthTipFilterChips: React.FC<HealthTipFilterChipsProps> = ({
  selectedCategory,
  onSelectCategory,
  showChronicCategory = true,
}) => {
  const categories: (HealthTipCategory | "All")[] = [
    "All",
    "General Wellness",
    "Nutrition",
    "Seasonal",
  ];

  if (showChronicCategory) {
    categories.push("Chronic Condition Management");
  }

  return (
    <div className="flex flex-wrap items-center gap-2 my-2">
      {categories.map((cat) => {
        const isSelected = selectedCategory === cat;
        return (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            type="button"
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer focus-ring ${
              isSelected
                ? "bg-[#0F6E7A] text-white shadow-xs"
                : "bg-white text-[#5C6B6E] hover:text-[#1E2A2E] border border-[#E6F4F3] hover:bg-[#E6F4F3]/50"
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
};
