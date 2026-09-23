"use client";

import React, { useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { HospitalWithDistance } from "@/types/hospital";
import { MapPin, Navigation, ExternalLink, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
  minHeight: "380px",
  borderRadius: "16px",
};

// Default center: Kolkata coordinates
const defaultCenter = {
  lat: 22.5726,
  lng: 88.3639,
};

export interface HospitalMapProps {
  hospitals: HospitalWithDistance[];
  selectedHospitalId?: string | null;
  onSelectHospital: (hospital: HospitalWithDistance) => void;
}

export const HospitalMap: React.FC<HospitalMapProps> = ({
  hospitals,
  selectedHospitalId,
  onSelectHospital,
}) => {
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(selectedHospitalId || null);

  const rawApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const hasValidApiKey = Boolean(rawApiKey && !rawApiKey.includes("MOCK"));

  const { isLoaded, loadError } = useJsApiLoader(
    hasValidApiKey
      ? {
          id: "google-map-script",
          googleMapsApiKey: rawApiKey as string,
        }
      : {
          id: "disabled-map",
          googleMapsApiKey: "",
        }
  );

  const selectedHospital = hospitals.find(
    (h) => h.hospital_id === (activeMarkerId || selectedHospitalId)
  );

  // If no valid Google Maps API key or if loading fails, immediately render the interactive Soft Clinical Map
  if (!hasValidApiKey || loadError || !isLoaded) {
    return (
      <div className="w-full h-full min-h-[380px] bg-gradient-to-br from-[#F0FDFA]/80 via-[#F8FAFC] to-white border-2 border-[#F0FDFA] rounded-2xl p-4 sm:p-6 flex flex-col justify-between relative overflow-hidden shadow-inner">
        {/* Mock Map Grid Background Lines */}
        <div className="absolute inset-0 bg-[radial-gradient(#0D9488_1px,transparent_1px)] [background-size:20px_20px] opacity-15 pointer-events-none" />

        {/* Top Header info */}
        <div className="relative z-10 flex items-center justify-between bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[#0D9488]/20 shadow-xs">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-[#0D9488] animate-pulse" />
            <span className="font-heading font-bold text-xs text-[#0F172A]">
              Interactive Hospital Map View
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#0D9488] bg-[#F0FDFA] px-2 py-0.5 rounded-full font-bold">
            {hospitals.length} Markers Plotted
          </span>
        </div>

        {/* Mock Markers Stack Visualizer */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
          {hospitals.slice(0, 6).map((hosp) => {
            const isSelected = hosp.hospital_id === (selectedHospitalId || activeMarkerId);

            return (
              <button
                key={hosp.hospital_id}
                onClick={() => {
                  setActiveMarkerId(hosp.hospital_id);
                  onSelectHospital(hosp);
                }}
                type="button"
                className={`p-3 rounded-xl border transition-all text-left cursor-pointer focus-ring ${
                  isSelected
                    ? "bg-[#0D9488] text-white border-[#0D9488] shadow-clinical scale-102"
                    : "bg-white/90 hover:bg-[#F0FDFA] text-[#0F172A] border-[#F0FDFA]"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isSelected ? "text-white" : "text-[#0D9488]"
                    }`}
                  />
                  <span className="font-heading font-bold text-xs truncate">
                    {hosp.hospital_name}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono opacity-90">
                  <span>{hosp.distance_km} km</span>
                  <span>{hosp.estimated_time}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Hospital Info Footer */}
        {selectedHospital && (
          <div className="relative z-10 bg-white p-3.5 rounded-xl border border-[#0D9488]/30 shadow-clinical-lg flex items-center justify-between gap-3 animate-in fade-in duration-150">
            <div>
              <h4 className="font-heading font-bold text-xs text-[#0F172A]">
                {selectedHospital.hospital_name}
              </h4>
              <p className="text-[11px] text-[#64748B] font-mono">
                {selectedHospital.distance_km} km away • {selectedHospital.estimated_time}
              </p>
            </div>

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selectedHospital.latitude},${selectedHospital.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <Button variant="primary" size="sm">
                <span>Navigate</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </Button>
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[380px] rounded-2xl overflow-hidden border-2 border-[#F0FDFA] shadow-clinical">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={
          selectedHospital
            ? { lat: selectedHospital.latitude, lng: selectedHospital.longitude }
            : defaultCenter
        }
        zoom={12}
      >
        {hospitals.map((hosp) => {
          const isSelected = hosp.hospital_id === (selectedHospitalId || activeMarkerId);

          return (
            <Marker
              key={hosp.hospital_id}
              position={{ lat: hosp.latitude, lng: hosp.longitude }}
              title={hosp.hospital_name}
              onClick={() => {
                setActiveMarkerId(hosp.hospital_id);
                onSelectHospital(hosp);
              }}
              icon={
                isSelected
                  ? "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                  : "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
              }
            />
          );
        })}

        {selectedHospital && (
          <InfoWindow
            position={{ lat: selectedHospital.latitude, lng: selectedHospital.longitude }}
            onCloseClick={() => setActiveMarkerId(null)}
          >
            <div className="p-1 font-body text-xs flex flex-col gap-1 max-w-xs">
              <h4 className="font-bold text-[#0F172A]">{selectedHospital.hospital_name}</h4>
              <p className="text-[#64748B] font-mono">
                {selectedHospital.distance_km} km • {selectedHospital.estimated_time}
              </p>
              <button
                onClick={() => onSelectHospital(selectedHospital)}
                type="button"
                className="text-left font-semibold text-[#0D9488] underline cursor-pointer mt-1"
              >
                View Hospital Details
              </button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};
