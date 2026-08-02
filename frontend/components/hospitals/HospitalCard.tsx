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
  ChevronRight,
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
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`;

  return (
    <Card
      onClick={() => {
        onSelect(hospital);
      }}
      className={`p-4 sm:p-5 border-2 transition-all duration-150 cursor-pointer flex flex-col gap-3.5 ${
        isSelected
          ? "border-[#0F6E7A] bg-[#E6F4F3]/40 shadow-clinical"
          : "border-[#E6F4F3] bg-white hover:border-[#0F6E7A]/40 shadow-xs"
      }`}
    >
      {/* Header Info */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-bold text-base text-[#1E2A2E] leading-snug">
              {hospital.hospital_name}
            </h3>
            {hospital.has_emergency_room && (
              <span className="text-[10px] font-bold uppercase text-white bg-[#E5573F] px-2 py-0.5 rounded-full shrink-0">
                24/7 ER
              </span>
            )}
          </div>

          <p className="text-xs text-[#5C6B6E] line-clamp-1" title={hospital.address}>
            <MapPin className="w-3.5 h-3.5 inline mr-1 text-[#0F6E7A]" />
            {hospital.address}, {hospital.city}
          </p>
        </div>

        {hospital.rating && (
          <div className="flex items-center gap-1 bg-[#FEF3C7] text-[#92400E] px-2 py-0.5 rounded-lg text-xs font-bold font-mono shrink-0">
            <Star className="w-3.5 h-3.5 fill-[#92400E]" />
            <span>{hospital.rating}</span>
          </div>
        )}
      </div>

      {/* Prominent Decision Metrics (Distance & Drive Time in IBM Plex Mono) */}
      <div className="flex items-center gap-4 bg-[#F7FAFA] p-3 rounded-xl border border-[#E6F4F3] text-xs font-mono">
        <div className="flex items-center gap-1.5 font-bold text-[#0F6E7A]">
          <Navigation className="w-4 h-4" />
          <span>{hospital.distance_km} km</span>
        </div>

        <div className="flex items-center gap-1.5 font-semibold text-[#1E2A2E]">
          <Clock className="w-4 h-4 text-[#5C6B6E]" />
          <span>{hospital.estimated_time}</span>
        </div>
      </div>

      {/* Specialty Tags */}
      <div className="flex flex-wrap gap-1.5">
        {hospital.specialties.slice(0, 3).map((spec) => (
          <span
            key={spec}
            className="text-[11px] font-medium text-[#0F6E7A] bg-[#E6F4F3] px-2.5 py-0.5 rounded-full border border-[#0F6E7A]/15"
          >
            {spec}
          </span>
        ))}
        {hospital.specialties.length > 3 && (
          <span className="text-[11px] text-[#5C6B6E] px-1 py-0.5">
            +{hospital.specialties.length - 3} more
          </span>
        )}
      </div>

      {/* Direct Action Buttons */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E6F4F3] mt-1">
        <a
          href={`tel:${hospital.phone.replace(/\s+/g, "")}`}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Call ${hospital.hospital_name}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F6E7A] hover:underline focus-ring rounded p-1"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>{hospital.phone}</span>
        </a>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(hospital);
            }}
            type="button"
            className="text-xs font-semibold text-[#5C6B6E] hover:text-[#0F6E7A] px-2 py-1 focus-ring rounded cursor-pointer"
          >
            Details
          </button>

          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            aria-label={`Get directions to ${hospital.hospital_name}`}
          >
            <Button variant="primary" size="sm" className="px-3 py-1 text-xs">
              <Navigation className="w-3.5 h-3.5 mr-1" />
              <span>Directions</span>
            </Button>
          </a>
        </div>
      </div>
    </Card>
  );
};
