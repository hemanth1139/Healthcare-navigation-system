"use client";

import React, { useState } from "react";
import { SlidersHorizontal, MapPin, Navigation, Search } from "lucide-react";
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
  const [locationText, setLocationText] = useState("Chennai, Tamil Nadu");
  const [isDetecting, setIsDetecting] = useState(false);

  const handleDetectGPS = () => {
    setIsDetecting(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationText("Current GPS Location (Auto-Detected)");
          setIsDetecting(false);
        },
        () => {
          setLocationText("Chennai Central (Default GPS)");
          setIsDetecting(false);
        }
      );
    } else {
      setIsDetecting(false);
    }
  };

  return (
    <div className="card-clinical p-5 flex flex-col gap-4">
      {/* Search Header Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        {/* Location Input with GPS */}
        <div className="relative flex-1 w-full">
          <MapPin className="w-4 h-4 text-[#0D9488] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
            placeholder="Enter city, pincode, or landmark..."
            className="w-full text-xs font-semibold text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-24 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#0D9488]"
          />
          <button
            type="button"
            onClick={handleDetectGPS}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-teal-500/10 text-[#0D9488] hover:bg-teal-500/20 text-[11px] font-bold flex items-center gap-1 transition-colors"
          >
            <Navigation className={`w-3 h-3 ${isDetecting ? "animate-spin" : ""}`} />
            <span>GPS</span>
          </button>
        </div>

        {/* Search Trigger Button */}
        <button
          type="button"
          className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4" />
          <span>Search Hospitals</span>
        </button>
      </div>

      {/* Filter Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
        {/* Specialty Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Specialty Department
          </label>
          <select
            value={specialistFilter}
            onChange={(e) => onSpecialistChange(e.target.value)}
            className="w-full text-xs font-semibold text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:border-[#0D9488]"
          >
            <option value="">All Specialty Departments</option>
            <option value="Cardiology">Cardiology (Heart)</option>
            <option value="Neurology">Neurology (Brain & Nerves)</option>
            <option value="Pulmonology">Pulmonology (Lungs)</option>
            <option value="General Medicine">General Medicine</option>
            <option value="Emergency Medicine">Emergency Trauma (24/7)</option>
            <option value="Gastroenterology">Gastroenterology</option>
          </select>
        </div>

        {/* Distance Radius Slider (1km - 50km) */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Radius Slider
            </label>
            <span className="text-xs font-mono font-bold text-[#0D9488]">
              {maxDistance === 0 ? "Any distance" : `${maxDistance} km`}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={50}
            value={maxDistance || 10}
            onChange={(e) => onDistanceChange(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#0D9488]"
          />
        </div>

        {/* Sort By */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Sort Order
          </label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full text-xs font-semibold text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:border-[#0D9488]"
          >
            <option value="distance">Distance (Nearest First)</option>
            <option value="time">Drive Time</option>
            <option value="rating">Patient Rating (Highest First)</option>
          </select>
        </div>
      </div>
    </div>
  );
};

