"use client";

import React from "react";

const CATEGORIES = [
  "All",
  "Central Government",
  "State Government",
  "Health Ministry",
  "Senior Care",
  "Maternal Health",
];

export interface SchemeFilterChipsProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const SchemeFilterChips: React.FC<SchemeFilterChipsProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 my-2">
      {CATEGORIES.map((cat) => {
        const isSelected = selectedCategory === cat;
        return (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            type="button"
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer focus-ring ${
              isSelected
                ? "bg-[#0D9488] text-white shadow-xs"
                : "bg-white text-[#64748B] hover:text-[#0F172A] border border-[#F0FDFA] hover:bg-[#F0FDFA]/50"
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
};
