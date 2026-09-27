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
  Building2,
  ExternalLink,
  CheckCircle2,
  Stethoscope,
  Info,
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

  const directionsUrl =
    hospital.google_maps_url ||
    `https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`;

  const formatDistance = (distKm: number) => {
    if (distKm < 1) {
      return `${Math.round(distKm * 1000)} m away`;
    }
    return `${distKm.toFixed(1)} km away`;
  };

  const hasValidPhone = Boolean(hospital.phone && hospital.phone.trim().length > 4);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={hospital.hospital_name}
      subtitle={`${formatDistance(hospital.distance_km)}${
        hospital.estimated_time ? ` • ${hospital.estimated_time}` : ""
      }`}
    >
      <div className="flex flex-col gap-5 pt-1">
        {/* Type & Emergency Room Banner */}
        <div className="flex flex-wrap items-center gap-2">
          {hospital.hospital_type && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-xl">
              <Building2 className="w-3.5 h-3.5" />
              <span>{hospital.hospital_type}</span>
            </span>
          )}

          {hospital.has_emergency_room && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 px-3 py-1 rounded-xl">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>24/7 Emergency & Trauma Center</span>
            </span>
          )}
        </div>

        {/* Address & Coordinates */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-800">
            <MapPin className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{hospital.address}</p>
              <p className="text-slate-500 text-xs">
                {hospital.city ? `${hospital.city}, ` : ""}
                {hospital.state || ""}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-200/60">
            <span>
              Coordinates: {hospital.latitude.toFixed(4)}, {hospital.longitude.toFixed(4)}
            </span>
            <span className="text-[#0D9488] font-bold">{formatDistance(hospital.distance_km)}</span>
          </div>
        </div>

        {/* Contact Numbers & Website Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {hasValidPhone && (
            <a
              href={`tel:${hospital.phone?.replace(/[^\d+]/g, "")}`}
              aria-label={`Call ${hospital.hospital_name}`}
              className="flex items-center justify-between bg-slate-50 hover:bg-[#F0FDFA] p-3.5 rounded-2xl border border-slate-200 hover:border-[#0D9488] font-bold text-[#0D9488] transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-100/60 text-[#0D9488] flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] uppercase text-slate-500 font-bold">Helpline / Front Desk</span>
                  <span className="text-xs text-slate-900 group-hover:text-[#0D9488]">{hospital.phone}</span>
                </div>
              </div>
            </a>
          )}

          {hospital.website && (
            <a
              href={hospital.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between bg-slate-50 hover:bg-[#F0FDFA] p-3.5 rounded-2xl border border-slate-200 hover:border-[#0D9488] font-bold text-[#0D9488] transition-all group truncate"
            >
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-8 h-8 rounded-xl bg-teal-100/60 text-[#0D9488] flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-left truncate">
                  <span className="text-[10px] uppercase text-slate-500 font-bold">Official Portal</span>
                  <span className="text-xs text-slate-900 group-hover:text-[#0D9488] truncate">
                    Visit Website
                  </span>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-[#0D9488] shrink-0" />
            </a>
          )}
        </div>

        {/* Clinical Specialties */}
        {hospital.specialties && hospital.specialties.length > 0 && (
          <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Stethoscope className="w-4 h-4 text-[#0D9488]" />
              <span>Available Specialties & Departments</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {hospital.specialties.map((spec) => (
                <span
                  key={spec}
                  className="text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-[#F0FDFA] hover:text-[#0D9488] px-3 py-1.5 rounded-xl border border-slate-200 transition-colors"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Transparency Notice */}
        <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-[11px] text-slate-500">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>
            Hospital location and department information are indexed from verified regional healthcare directories. Please verify specific outpatient appointment schedules directly with the hospital before visiting.
          </span>
        </div>

        {/* Primary Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          {hasValidPhone ? (
            <a
              href={`tel:${hospital.phone?.replace(/[^\d+]/g, "")}`}
              aria-label={`Call ${hospital.hospital_name}`}
              className="w-full"
            >
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                className="border-slate-200 text-slate-700 hover:text-[#0D9488] rounded-xl font-bold"
              >
                <Phone className="w-4 h-4 mr-2 text-[#0D9488]" />
                <span>Call Hospital</span>
              </Button>
            </a>
          ) : (
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              disabled
              className="border-slate-200 text-slate-400 rounded-xl"
            >
              <span>No Phone Available</span>
            </Button>
          )}

          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Get directions to ${hospital.hospital_name}`}
            className="w-full"
          >
            <Button variant="primary" size="lg" fullWidth className="rounded-xl font-bold">
              <Navigation className="w-4 h-4 mr-2" />
              <span>Get Directions</span>
            </Button>
          </a>
        </div>
      </div>
    </Modal>
  );
};
