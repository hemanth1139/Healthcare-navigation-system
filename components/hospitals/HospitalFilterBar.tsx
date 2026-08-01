"use client";

import React from "react";
import { Filter, SlidersHorizontal, MapPin, Search } from "lucide-react";

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
  return (
    <div className="bg-white border-2 border-[#E6F4F3] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col gap-4">
      {/* Top Header & Count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E6F4F3] pb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#0F6E7A]" />
          <h3 className="font-heading font-bold text-sm text-[#1E2A2E]">
            Filter & Sort Facilities
          </h3>
        </div>

        <span className="text-xs font-mono font-bold text-[#0F6E7A] bg-[#E6F4F3] px-3 py-1 rounded-full w-fit">
          {resultCount} {resultCount === 1 ? "Hospital" : "Hospitals"} Found
        </span>
      </div>

      {/* Filter Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Specialist Specialty Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-[#5C6B6E]">Specialty Filter</label>
          <div className="relative">
            <select
              value={specialistFilter}
              onChange={(e) => onSpecialistChange(e.target.value)}
              className="w-full font-body text-xs text-[#1E2A2E] bg-[#F7FAFA] border border-[#E6F4F3] rounded-xl px-3 py-2 focus-ring cursor-pointer"
            >
              <option value="">All Specialties</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Neurology">Neurology</option>
              <option value="Pulmonology">Pulmonology</option>
              <option value="General Medicine">General Medicine</option>
              <option value="Emergency Medicine">Emergency Medicine</option>
              <option value="ENT">ENT</option>
            </select>
          </div>
        </div>

        {/* Distance Radius Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-[#5C6B6E]">Distance Radius</label>
          <select
            value={maxDistance}
            onChange={(e) => onDistanceChange(Number(e.target.value))}
            className="w-full font-body text-xs text-[#1E2A2E] bg-[#F7FAFA] border border-[#E6F4F3] rounded-xl px-3 py-2 focus-ring cursor-pointer font-mono"
          >
            <option value={0}>Any Distance</option>
            <option value={5}>Within 5 km</option>
            <option value={10}>Within 10 km</option>
            <option value={25}>Within 25 km</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-[#5C6B6E]">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full font-body text-xs text-[#1E2A2E] bg-[#F7FAFA] border border-[#E6F4F3] rounded-xl px-3 py-2 focus-ring cursor-pointer"
          >
            <option value="distance">Distance (Nearest First)</option>
            <option value="time">Estimated Drive Time</option>
            <option value="rating">Patient Rating</option>
          </select>
        </div>
      </div>
    </div>
  );
};
