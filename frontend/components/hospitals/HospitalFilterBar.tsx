"use client";

import React from "react";
import { Filter, SlidersHorizontal, MapPin, Search } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export interface HospitalFilterBarProps {
  specialistFilter: string;
  onSpecialistChange: (val: string) => void;
  maxDistance: number;
  onDistanceChange: (val: number) => void;
  sortBy: string;
  onSortChange: (val: string) => void;
  resultCount: number;
}

export const HospitalFilterBar: React.FC<HospitalFilterBarProps> = ({
  specialistFilter,
  onSpecialistChange,
  maxDistance,
  onDistanceChange,
  sortBy,
  onSortChange,
  resultCount,
}) => {
  const { language } = useLanguage();

  return (
    <div className="bg-white border-2 border-[#F0FDFA] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col gap-4">
      {/* Top Header & Count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0FDFA] pb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#0D9488]" />
          <h3 className="font-heading font-bold text-sm text-[#0F172A]">
            {language === "ta" ? "மருத்துவமனைகளை வடிகட்டவும்" : "Filter & Sort Facilities"}
          </h3>
        </div>

        <span className="text-xs font-mono font-bold text-[#0D9488] bg-[#F0FDFA] px-3 py-1 rounded-full w-fit">
          {resultCount} {language === "ta" ? "மருத்துவமனைகள் கண்டறியப்பட்டன" : resultCount === 1 ? "Hospital Found" : "Hospitals Found"}
        </span>
      </div>

      {/* Filter Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Specialist Specialty Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-[#64748B]">
            {language === "ta" ? "சிறப்பு பிரிவு வடிகட்டி" : "Specialty Filter"}
          </label>
          <div className="relative">
            <select
              value={specialistFilter}
              onChange={(e) => onSpecialistChange(e.target.value)}
              className="w-full font-body text-xs text-[#0F172A] bg-[#F8FAFC] border border-[#F0FDFA] rounded-xl px-3 py-2 focus-ring cursor-pointer"
            >
              <option value="">{language === "ta" ? "அனைத்து மருத்துவ பிரிவுகள்" : "All Specialties"}</option>
              <option value="Cardiology">{language === "ta" ? "இதயவியல் (Cardiology)" : "Cardiology"}</option>
              <option value="Neurology">{language === "ta" ? "நரம்பியல் (Neurology)" : "Neurology"}</option>
              <option value="Pulmonology">{language === "ta" ? "நுரையீரலியல் (Pulmonology)" : "Pulmonology"}</option>
              <option value="General Medicine">{language === "ta" ? "பொது மருத்துவம் (General Medicine)" : "General Medicine"}</option>
              <option value="Emergency Medicine">{language === "ta" ? "அவசர மருத்துவம் (Emergency Medicine)" : "Emergency Medicine"}</option>
              <option value="ENT">{language === "ta" ? "காது மூக்கு தொண்டை (ENT)" : "ENT"}</option>
            </select>
          </div>
        </div>

        {/* Distance Radius Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-[#64748B]">
            {language === "ta" ? "தொலைவு எல்லை" : "Distance Radius"}
          </label>
          <select
            value={maxDistance}
            onChange={(e) => onDistanceChange(Number(e.target.value))}
            className="w-full font-body text-xs text-[#0F172A] bg-[#F8FAFC] border border-[#F0FDFA] rounded-xl px-3 py-2 focus-ring cursor-pointer font-mono"
          >
            <option value={0}>{language === "ta" ? "எந்த தொலைவும்" : "Any Distance"}</option>
            <option value={5}>{language === "ta" ? "5 கி.மீ எல்லைக்குள்" : "Within 5 km"}</option>
            <option value={10}>{language === "ta" ? "10 கி.மீ எல்லைக்குள்" : "Within 10 km"}</option>
            <option value={25}>{language === "ta" ? "25 கி.மீ எல்லைக்குள்" : "Within 25 km"}</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-[#64748B]">
            {language === "ta" ? "வரிசைப்படுத்துக" : "Sort By"}
          </label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full font-body text-xs text-[#0F172A] bg-[#F8FAFC] border border-[#F0FDFA] rounded-xl px-3 py-2 focus-ring cursor-pointer"
          >
            <option value="distance">{language === "ta" ? "தொலைவு (அருகில் இருப்பது முதலில்)" : "Distance (Nearest First)"}</option>
            <option value="time">{language === "ta" ? "பயண நேரம்" : "Estimated Drive Time"}</option>
            <option value="rating">{language === "ta" ? "நோயாளி மதிப்பீடு" : "Patient Rating"}</option>
          </select>
        </div>
      </div>
    </div>
  );
};
