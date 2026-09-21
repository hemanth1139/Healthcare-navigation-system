"use client";

import React from "react";
import { HealthTipCategory } from "@/types/healthTip";
import { useLanguage } from "@/context/LanguageContext";

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
  const { language } = useLanguage();

  const categories: (HealthTipCategory | "All")[] = [
    "All",
    "General Wellness",
    "Nutrition",
    "Seasonal",
  ];

  if (showChronicCategory) {
    categories.push("Chronic Condition Management");
  }

  const getLabel = (cat: HealthTipCategory | "All") => {
    if (language !== "ta") return cat;
    switch (cat) {
      case "All": return "அனைத்தும்";
      case "General Wellness": return "பொது நல்வாழ்வு";
      case "Nutrition": return "ஊட்டச்சத்து";
      case "Seasonal": return "பருவகால ஆரோக்கியம்";
      case "Chronic Condition Management": return "நாள்பட்ட நோய் பராமரிப்பு";
      default: return cat;
    }
  };

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
                ? "bg-[#0D9488] text-white shadow-xs"
                : "bg-white text-[#64748B] hover:text-[#0F172A] border border-[#F0FDFA] hover:bg-[#F0FDFA]/50"
            }`}
          >
            {getLabel(cat)}
          </button>
        );
      })}
    </div>
  );
};
