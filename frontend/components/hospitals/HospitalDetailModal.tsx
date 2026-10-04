"use client";

import React from "react";
import { HospitalWithDistance } from "@/types/hospital";
import { Modal } from "@/components/ui/Modal";
import {
  MapPin,
  Phone,
  Globe,
  Navigation,
  Clock,
  ShieldAlert,
  Building2,
  ExternalLink,
  Star,
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
      return `${Math.round(distKm * 1000)}m`;
    }
    return `${distKm.toFixed(1)}km`;
  };

  const hasValidPhone = Boolean(hospital.phone && hospital.phone.trim().length > 4);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      subtitle=""
      maxWidth="2xl"
      fitViewport
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {/* Header Section with Hospital Name and Rating */}
        <div className="flex flex-col gap-2 md:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                {hospital.hospital_name}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                {hospital.rating && (
                  <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-lg">
                    <Star className="w-4 h-4 fill-amber-500" />
                    <span className="text-sm font-bold">{hospital.rating.toFixed(1)}</span>
                  </div>
                )}
                <span className="text-sm text-slate-500">
                  {formatDistance(hospital.distance_km)} away
                </span>
              </div>
            </div>
          </div>

          {/* Type & Emergency Badges */}
          <div className="flex flex-wrap gap-1.5">
            {hospital.hospital_type && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-lg">
                <Building2 className="w-3.5 h-3.5" />
                <span>{hospital.hospital_type}</span>
              </span>
            )}
            {hospital.has_emergency_room && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span>24/7 Emergency</span>
              </span>
            )}
          </div>
        </div>

        {/* Address Card */}
        <div className="md:col-span-2 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-[#0D9488] flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">{hospital.address}</p>
              <p className="text-sm text-slate-600 mt-1">
                {hospital.city && `${hospital.city}, `}
                {hospital.state || "Tamil Nadu"}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-2">
          {hasValidPhone && (
            <a
              href={`tel:${hospital.phone?.replace(/[^\d+]/g, "")}`}
              aria-label={`Call ${hospital.hospital_name}`}
              className="group"
            >
              <div className="bg-white border-2 border-slate-200 hover:border-[#0D9488] hover:bg-[#F0FDFA] rounded-xl p-2 transition-all cursor-pointer">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-9 h-9 rounded-lg bg-teal-100 text-[#0D9488] flex items-center justify-center group-hover:bg-[#0D9488] group-hover:text-white transition-colors">
                    <Phone className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 group-hover:text-[#0D9488]">Call Now</span>
                </div>
              </div>
            </a>
          )}

          {hospital.website && (
            <a
              href={hospital.website}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <div className="bg-white border-2 border-slate-200 hover:border-[#0D9488] hover:bg-[#F0FDFA] rounded-xl p-2 transition-all cursor-pointer">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-9 h-9 rounded-lg bg-teal-100 text-[#0D9488] flex items-center justify-center group-hover:bg-[#0D9488] group-hover:text-white transition-colors">
                    <Globe className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 group-hover:text-[#0D9488]">Website</span>
                </div>
              </div>
            </a>
          )}

          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Get directions to ${hospital.hospital_name}`}
            className="group col-span-2"
          >
            <div className="bg-gradient-to-r from-[#0D9488] to-[#0F766E] hover:from-[#0F766E] hover:to-[#115E59] rounded-xl p-3 transition-all cursor-pointer">
              <div className="flex items-center justify-center gap-3">
                <Navigation className="w-5 h-5 text-white" />
                <span className="text-sm font-bold text-white">Get Directions on Google Maps</span>
                <ExternalLink className="w-4 h-4 text-white/80" />
              </div>
            </div>
          </a>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 gap-2">
          {hospital.opening_hours && (
            <div className="bg-white border border-slate-200 rounded-xl p-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Operating Hours</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">{hospital.opening_hours}</p>
                </div>
              </div>
            </div>
          )}

          {hospital.beds != null && (
            <div className="bg-white border border-slate-200 rounded-xl p-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Bed Capacity</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">{hospital.beds.toLocaleString()} beds</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Specialties Section */}
        {hospital.specialties && hospital.specialties.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-teal-100 text-[#0D9488] flex items-center justify-center">
                <Stethoscope className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Specialties & Departments</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {hospital.specialties.map((spec) => (
                <span
                  key={spec}
                  className="text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-teal-50 hover:text-[#0D9488] px-2 py-1.5 rounded-lg border border-slate-200 transition-colors"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Contact Info (if phone exists but not shown in quick actions) */}
        {hasValidPhone && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#0D9488]" />
                <div>
                  <p className="text-xs text-slate-500">Helpline Number</p>
                  <p className="text-sm font-semibold text-slate-900">{hospital.phone}</p>
                </div>
              </div>
              <a
                href={`tel:${hospital.phone?.replace(/[^\d+]/g, "")}`}
                className="text-sm font-semibold text-[#0D9488] hover:underline"
              >
                Call Now
              </a>
            </div>
          </div>
        )}

        {/* Info Notice */}
        <div className="md:col-span-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-900 leading-snug">
            Hospital services, hours, and bed capacity may change. Please contact the hospital directly to confirm emergency availability and appointment details before visiting.
          </p>
        </div>
      </div>
    </Modal>
  );
};
