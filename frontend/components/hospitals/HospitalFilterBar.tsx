"use client";

import React from "react";
import { SlidersHorizontal, Building2, Stethoscope, Navigation2, ArrowUpDown, RotateCcw, MapPin } from "lucide-react";

export interface HospitalFilterBarProps {
  selectedDistrict: string;
  onDistrictChange: (val: string) => void;
  hospitalType: string;
  onHospitalTypeChange: (val: string) => void;
  specialty: string;
  onSpecialtyChange: (val: string) => void;
  maxDistance: number;
  onDistanceChange: (val: number) => void;
  sortBy: string;
  onSortChange: (val: string) => void;
  resultCount: number;
  onResetFilters: () => void;
}

const TAMIL_NADU_DISTRICT_OPTIONS = [
  { value: "Chennai, Tamil Nadu", label: "Chennai (Primary Hub)" },
  { value: "Coimbatore, Tamil Nadu", label: "Coimbatore" },
  { value: "Madurai, Tamil Nadu", label: "Madurai" },
  { value: "Tiruchirappalli, Tamil Nadu", label: "Tiruchirappalli (Trichy)" },
  { value: "Salem, Tamil Nadu", label: "Salem" },
  { value: "Tirunelveli, Tamil Nadu", label: "Tirunelveli" },
  { value: "Vellore, Tamil Nadu", label: "Vellore" },
  { value: "Erode, Tamil Nadu", label: "Erode" },
  { value: "Thanjavur, Tamil Nadu", label: "Thanjavur" },
  { value: "Thoothukudi, Tamil Nadu", label: "Thoothukudi" },
  { value: "Kanchipuram, Tamil Nadu", label: "Kanchipuram" },
  { value: "Tiruvallur, Tamil Nadu", label: "Tiruvallur" },
  { value: "Dindigul, Tamil Nadu", label: "Dindigul" },
  { value: "Tiruppur, Tamil Nadu", label: "Tiruppur" },
  { value: "The Nilgiris (Ooty), Tamil Nadu", label: "The Nilgiris (Ooty)" },
  { value: "All Tamil Nadu", label: "All Tamil Nadu Districts" },
];

const HOSPITAL_TYPES = [
  { value: "All", label: "All Types" },
  { value: "Government", label: "Government" },
  { value: "Private", label: "Private" },
  { value: "Teaching / Medical College", label: "Teaching / Medical College" },
  { value: "Other", label: "Other" },
];

const SPECIALTIES = [
  { value: "", label: "All Specialties" },
  { value: "Emergency", label: "Emergency & Trauma" },
  { value: "Cardiology", label: "Cardiology" },
  { value: "Neurology", label: "Neurology" },
  { value: "Orthopedics", label: "Orthopedics" },
  { value: "General Medicine", label: "General Medicine" },
  { value: "Pediatrics", label: "Pediatrics" },
  { value: "Pulmonology", label: "Pulmonology" },
  { value: "Gastroenterology", label: "Gastroenterology" },
  { value: "Oncology", label: "Oncology" },
  { value: "Multi-Organ Transplant", label: "Organ Transplant" },
];

const DISTANCE_OPTIONS = [
  { value: 5, label: "Within 5 km" },
  { value: 10, label: "Within 10 km" },
  { value: 25, label: "Within 25 km" },
  { value: 50, label: "Within 50 km" },
  { value: 0, label: "Any Distance" },
];

const SORT_OPTIONS = [
  { value: "distance", label: "Nearest (Distance)" },
  { value: "name", label: "Hospital Name (A-Z)" },
  { value: "rating", label: "Top Rated" },
];

export const HospitalFilterBar: React.FC<HospitalFilterBarProps> = ({
  selectedDistrict,
  onDistrictChange,
  hospitalType,
  onHospitalTypeChange,
  specialty,
  onSpecialtyChange,
  maxDistance,
  onDistanceChange,
  sortBy,
  onSortChange,
  resultCount,
  onResetFilters,
}) => {
  const hasActiveFilters =
    (hospitalType && hospitalType !== "All") ||
    Boolean(specialty) ||
    maxDistance > 0 ||
    sortBy !== "distance";

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col gap-4">
      {/* Top Filter Bar Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#0D9488]" />
          <span className="font-heading font-bold text-sm text-[#0F172A]">
            Filter Tamil Nadu Facilities
          </span>
          <span className="text-xs font-mono font-bold text-[#0D9488] bg-[#F0FDFA] px-2.5 py-0.5 rounded-full border border-[#0D9488]/20">
            {resultCount} {resultCount === 1 ? "hospital" : "hospitals"} in scope
          </span>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#64748B] hover:text-[#0D9488] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset filters</span>
          </button>
        )}
      </div>

      {/* Filter Select Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Tamil Nadu District / City */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#0D9488]" />
            <span>Location / District</span>
          </label>
          <select
            value={selectedDistrict}
            onChange={(e) => onDistrictChange(e.target.value)}
            className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#0D9488] transition-all"
          >
            {TAMIL_NADU_DISTRICT_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* Hospital Type */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-[#0D9488]" />
            <span>Hospital Type</span>
          </label>
          <select
            value={hospitalType || "All"}
            onChange={(e) => onHospitalTypeChange(e.target.value)}
            className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#0D9488] transition-all"
          >
            {HOSPITAL_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clinical Specialty */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1">
            <Stethoscope className="w-3.5 h-3.5 text-[#0D9488]" />
            <span>Specialty / Service</span>
          </label>
          <select
            value={specialty}
            onChange={(e) => onSpecialtyChange(e.target.value)}
            className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#0D9488] transition-all"
          >
            {SPECIALTIES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Distance Radius */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1">
            <Navigation2 className="w-3.5 h-3.5 text-[#0D9488]" />
            <span>Search Radius</span>
          </label>
          <select
            value={maxDistance}
            onChange={(e) => onDistanceChange(Number(e.target.value))}
            className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#0D9488] transition-all"
          >
            {DISTANCE_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Order */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#0D9488]" />
            <span>Sort By</span>
          </label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#0D9488] transition-all"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
