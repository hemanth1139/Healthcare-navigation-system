"use client";

import React from "react";
import { HospitalWithDistance } from "@/types/hospital";
import { HospitalCard } from "./HospitalCard";
import { Button } from "@/components/ui/Button";
import { MapPinOff, Maximize2 } from "lucide-react";

export interface HospitalListProps {
  hospitals: HospitalWithDistance[];
  selectedHospitalId?: string | null;
  onSelectHospital: (hospital: HospitalWithDistance) => void;
  onOpenDetail: (hospital: HospitalWithDistance) => void;
  onExpandDistance?: () => void;
}

export const HospitalList: React.FC<HospitalListProps> = ({
  hospitals,
  selectedHospitalId,
  onSelectHospital,
  onOpenDetail,
  onExpandDistance,
}) => {
  if (hospitals.length === 0) {
    return (
      <div className="bg-white border-2 border-dashed border-[#F0FDFA] rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#F0FDFA] text-[#0D9488] flex items-center justify-center">
          <MapPinOff className="w-6 h-6" />
        </div>
        <h3 className="font-heading font-bold text-base text-[#0F172A]">
          No hospitals found within this search range
        </h3>
        <p className="text-xs text-[#64748B] max-w-sm">
          Try expanding your distance radius filter or clearing the specialty filter to see nearby medical facilities.
        </p>

        {onExpandDistance && (
          <Button onClick={onExpandDistance} variant="secondary" size="md" className="mt-2">
            <Maximize2 className="w-4 h-4 mr-1.5" />
            Expand Radius to 25 km
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
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
