"use client";

import React from "react";
import { HospitalWithDistance } from "@/types/hospital";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  MapPin,
  Phone,
  Globe,
  Navigation,
  Clock,
  ShieldAlert,
  Star,
  Building2,
} from "lucide-react";

export interface HospitalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospital: HospitalWithDistance | null;
}

export const HospitalDetailModal: React.FC<HospitalDetailModalProps> = ({
  isOpen,
  onClose,
  hospital,
}) => {
  if (!hospital) return null;

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={hospital.hospital_name}
      subtitle={`${hospital.distance_km} km away • ${hospital.estimated_time}`}
    >
      <div className="flex flex-col gap-5 pt-1">
        {/* ER Availability Banner if present */}
        {hospital.has_emergency_room && (
          <div className="bg-[#FDF0EE] border border-[#E5573F]/30 rounded-xl p-3 flex items-center gap-2.5 text-xs text-[#E5573F] font-bold">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>24/7 Emergency Trauma Department Available</span>
          </div>
        )}

        {/* Address */}
        <div className="flex items-start gap-2.5 text-xs sm:text-sm text-[#1E2A2E]">
          <MapPin className="w-4 h-4 text-[#0F6E7A] shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">{hospital.address}</p>
            <p className="text-[#5C6B6E]">
              {hospital.city}, {hospital.state}
            </p>
          </div>
        </div>

        {/* Contact Phone & Website */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <a
            href={`tel:${hospital.phone.replace(/\s+/g, "")}`}
            aria-label={`Call ${hospital.hospital_name}`}
            className="flex items-center gap-2 bg-[#F7FAFA] p-3 rounded-xl border border-[#E6F4F3] font-bold text-[#0F6E7A] hover:bg-[#E6F4F3] transition-colors"
          >
            <Phone className="w-4 h-4" />
            <span>{hospital.phone}</span>
          </a>

          {hospital.website ? (
            <a
              href={hospital.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#F7FAFA] p-3 rounded-xl border border-[#E6F4F3] font-semibold text-[#0F6E7A] hover:bg-[#E6F4F3] transition-colors truncate"
            >
              <Globe className="w-4 h-4 shrink-0" />
              <span className="truncate">Visit Hospital Website</span>
            </a>
          ) : (
            <div className="flex items-center gap-2 bg-[#F7FAFA] p-3 rounded-xl border border-[#E6F4F3] text-[#5C6B6E]">
              <Building2 className="w-4 h-4" />
              <span>Multispeciality Medical Facility</span>
            </div>
          )}
        </div>

        {/* Available Specialties */}
        <div className="flex flex-col gap-2 pt-2 border-t border-[#E6F4F3]">
          <span className="text-xs font-semibold text-[#5C6B6E]">Clinical Specialties Offered:</span>
          <div className="flex flex-wrap gap-1.5">
            {hospital.specialties.map((spec) => (
              <span
                key={spec}
                className="text-xs font-semibold text-[#0F6E7A] bg-[#E6F4F3] px-3 py-1 rounded-full border border-[#0F6E7A]/20"
              >
                {spec}
              </span>
            ))}
          </div>
        </div>

        {/* Side-by-Side Equally Weighted Primary Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#E6F4F3]">
          <a
            href={`tel:${hospital.phone.replace(/\s+/g, "")}`}
            aria-label={`Call ${hospital.hospital_name}`}
            className="w-full"
          >
            <Button variant="secondary" size="md" fullWidth className="border-[#0F6E7A]/30 text-[#0F6E7A]">
              <Phone className="w-4 h-4 mr-2" />
              <span>Call Hospital</span>
            </Button>
          </a>

          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Get directions to ${hospital.hospital_name}`}
            className="w-full"
          >
            <Button variant="primary" size="md" fullWidth>
              <Navigation className="w-4 h-4 mr-2" />
              <span>Get Directions</span>
            </Button>
          </a>
        </div>
      </div>
    </Modal>
  );
};
