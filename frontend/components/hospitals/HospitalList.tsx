"use client";

import React from "react";
import { HospitalWithDistance } from "@/types/hospital";
import { HospitalCard } from "./HospitalCard";
import { Button } from "@/components/ui/Button";
import { MapPinOff, Maximize2, MapPin, RotateCcw } from "lucide-react";

export interface HospitalListProps {
  hospitals: HospitalWithDistance[];
  selectedHospitalId?: string | null;
  onSelectHospital: (hospital: HospitalWithDistance) => void;
  onOpenDetail: (hospital: HospitalWithDistance) => void;
  onExpandDistance?: () => void;
  onChangeLocation?: () => void;
  onClearFilters?: () => void;
}

export const HospitalList: React.FC<HospitalListProps> = ({
  hospitals,
  selectedHospitalId,
  onSelectHospital,
  onOpenDetail,
  onExpandDistance,
  onChangeLocation,
  onClearFilters,
}) => {
  if (hospitals.length === 0) {
    return (
      <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-8 sm:p-10 text-center flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[#F0FDFA] text-[#0D9488] flex items-center justify-center shadow-xs">
          <MapPinOff className="w-7 h-7" />
        </div>
        <div className="flex flex-col gap-1.5 max-w-md">
          <h3 className="font-heading font-bold text-lg text-[#0F172A]">
            No healthcare facilities found
          </h3>
          <p className="text-xs sm:text-sm text-[#64748B]">
            No verified hospitals match your current location, department, or distance criteria. Try expanding the search radius or adjusting your filters.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
          {onExpandDistance && (
            <Button onClick={onExpandDistance} variant="primary" size="md" className="rounded-xl font-bold">
              <Maximize2 className="w-4 h-4 mr-1.5" />
              <span>Increase Radius to 50 km</span>
            </Button>
          )}

          {onChangeLocation && (
            <Button onClick={onChangeLocation} variant="secondary" size="md" className="rounded-xl font-bold">
              <MapPin className="w-4 h-4 mr-1.5 text-[#0D9488]" />
              <span>Change Location</span>
            </Button>
          )}

          {onClearFilters && (
            <Button onClick={onClearFilters} variant="secondary" size="md" className="rounded-xl font-bold">
              <RotateCcw className="w-4 h-4 mr-1.5" />
              <span>Clear Filters</span>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      {hospitals.map((hosp) => (
        <HospitalCard
          key={hosp.hospital_id}
          hospital={hosp}
          isSelected={hosp.hospital_id === selectedHospitalId}
          onSelect={onSelectHospital}
          onOpenDetail={onOpenDetail}
        />
      ))}
    </div>
  );
};
