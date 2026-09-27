"use client";

import React from "react";
import { HospitalWithDistance } from "@/types/hospital";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  MapPin,
  Clock,
  Phone,
  Navigation,
  Star,
  ShieldAlert,
  Building2,
  ExternalLink,
  Info,
} from "lucide-react";

export interface HospitalCardProps {
  hospital: HospitalWithDistance;
  isSelected?: boolean;
  onSelect: (hospital: HospitalWithDistance) => void;
  onOpenDetail: (hospital: HospitalWithDistance) => void;
}

export const HospitalCard: React.FC<HospitalCardProps> = ({
  hospital,
  isSelected = false,
  onSelect,
  onOpenDetail,
}) => {
  // Real directions navigation link
  const directionsUrl =
    hospital.google_maps_url ||
    `https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`;

  // Real distance formatting
  const formatDistance = (distKm: number) => {
    if (distKm < 1) {
      return `${Math.round(distKm * 1000)} m away`;
    }
    return `${distKm.toFixed(1)} km away`;
  };

  // Determine badge styling based on hospital type
  const getTypeBadge = (type?: string) => {
    if (!type) return null;
    if (type.toLowerCase().includes("govt") || type.toLowerCase().includes("government")) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full shrink-0">
          <Building2 className="w-3 h-3" />
          <span>Government Hospital</span>
        </span>
      );
    }
    if (type.toLowerCase().includes("teaching") || type.toLowerCase().includes("college")) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full shrink-0">
          <Building2 className="w-3 h-3" />
          <span>Teaching / Medical College</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full shrink-0">
        <Building2 className="w-3 h-3" />
        <span>{type}</span>
      </span>
    );
  };

  const hasValidPhone = Boolean(hospital.phone && hospital.phone.trim().length > 4);

  return (
    <Card
      onClick={() => {
        onSelect(hospital);
      }}
      className={`p-4 sm:p-5 border-2 transition-all duration-200 cursor-pointer flex flex-col gap-3.5 rounded-2xl ${
        isSelected
          ? "border-[#0D9488] bg-[#F0FDFA]/50 shadow-md scale-[1.01]"
          : "border-slate-200/80 bg-white hover:border-[#0D9488]/40 hover:shadow-xs"
      }`}
    >
      {/* Header: Name + Badges */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h3 className="font-heading font-bold text-base sm:text-lg text-[#0F172A] leading-snug">
              {hospital.hospital_name}
            </h3>
            <div className="flex items-center flex-wrap gap-2">
              {getTypeBadge(hospital.hospital_type)}
              {hospital.has_emergency_room && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full shrink-0">
                  <ShieldAlert className="w-3 h-3 text-rose-600" />
                  <span>24/7 Emergency</span>
                </span>
              )}
            </div>
          </div>

          {/* Rating (only rendered if reliable rating exists) */}
          {hospital.rating && hospital.rating > 0 && (
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-1 rounded-xl text-xs font-bold font-mono shrink-0">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>{hospital.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Address */}
        <p className="text-xs sm:text-sm text-[#64748B] flex items-start gap-1.5" title={hospital.address}>
          <MapPin className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
          <span>
            {hospital.address}
            {hospital.city ? `, ${hospital.city}` : ""}
            {hospital.state ? `, ${hospital.state}` : ""}
          </span>
        </p>
      </div>

      {/* Distance & Transit Metrics */}
      <div className="flex items-center gap-4 bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-100 text-xs font-mono">
        <div className="flex items-center gap-1.5 font-bold text-[#0D9488]">
          <Navigation className="w-4 h-4" />
          <span>{formatDistance(hospital.distance_km)}</span>
        </div>

        {hospital.estimated_time && (
          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>{hospital.estimated_time}</span>
          </div>
        )}
      </div>

      {/* Specialties Tags (real data only) */}
      {hospital.specialties && hospital.specialties.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Available Services
          </span>
          <div className="flex flex-wrap gap-1.5">
            {hospital.specialties.slice(0, 4).map((spec) => (
              <span
                key={spec}
                className="text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-[#F0FDFA] hover:text-[#0D9488] px-2.5 py-0.5 rounded-lg border border-slate-200 transition-colors"
              >
                {spec}
              </span>
            ))}
            {hospital.specialties.length > 4 && (
              <span className="text-[11px] text-[#64748B] font-medium px-1 py-0.5">
                +{hospital.specialties.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Contact & Primary Action Buttons */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 mt-1">
        {/* Phone link (only if valid phone exists) */}
        {hasValidPhone ? (
          <a
            href={`tel:${hospital.phone?.replace(/[^\d+]/g, "")}`}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Call ${hospital.hospital_name}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D9488] hover:text-[#0F766E] hover:underline p-1 rounded-lg transition-colors"
          >
            <Phone className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate max-w-[120px] sm:max-w-none">{hospital.phone}</span>
          </a>
        ) : (
          <span className="text-[11px] text-slate-400 italic">No phone on file</span>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(hospital);
            }}
            type="button"
            className="text-xs font-bold text-slate-600 hover:text-[#0D9488] bg-slate-100 hover:bg-[#F0FDFA] px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1"
          >
            <Info className="w-3.5 h-3.5" />
            <span>View Details</span>
          </button>

          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            aria-label={`Get directions to ${hospital.hospital_name}`}
          >
            <Button variant="primary" size="sm" className="px-3 py-1.5 text-xs font-bold rounded-xl">
              <Navigation className="w-3.5 h-3.5 mr-1" />
              <span>Directions</span>
            </Button>
          </a>
        </div>
      </div>
    </Card>
  );
};
