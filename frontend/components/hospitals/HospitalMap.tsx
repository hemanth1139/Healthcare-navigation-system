"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { HospitalWithDistance } from "@/types/hospital";
import { Navigation, MapPin, ZoomIn, ZoomOut, Maximize, ExternalLink, Building2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface HospitalMapProps {
  hospitals: HospitalWithDistance[];
  selectedHospitalId?: string | null;
  userCoords?: { latitude: number; longitude: number } | null;
  onSelectHospital: (hospital: HospitalWithDistance) => void;
  onOpenDetail?: (hospital: HospitalWithDistance) => void;
}

export const HospitalMap: React.FC<HospitalMapProps> = ({
  hospitals,
  selectedHospitalId,
  userCoords,
  onSelectHospital,
  onOpenDetail,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const userMarkerRef = useRef<L.Marker | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Initialize Leaflet Map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Default center: userCoords or first hospital or Chennai
    const initialLat =
      userCoords?.latitude || (hospitals.length > 0 ? hospitals[0].latitude : 13.0827);
    const initialLng =
      userCoords?.longitude || (hospitals.length > 0 ? hospitals[0].longitude : 80.2707);

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 12,
      zoomControl: false,
    });

    // Add OpenStreetMap tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;
    setIsMapReady(true);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      setIsMapReady(false);
    };
  }, []);

  // Update Markers when hospitals, selectedHospitalId, or userCoords change
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Clear previous hospital markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

      // Plot User location if available
      if (userCoords?.latitude && userCoords?.longitude) {
        const userIcon = L.divIcon({
          className: "user-location-marker",
          html: `
            <div style="position: relative; width: 24px; height: 24px;">
              <div style="position: absolute; inset: 0; background: rgba(13, 148, 136, 0.3); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="position: absolute; top: 4px; left: 4px; width: 16px; height: 16px; background: #0D9488; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const userMarker = L.marker([userCoords.latitude, userCoords.longitude], {
          icon: userIcon,
          zIndexOffset: 1000,
        }).addTo(map);

        userMarker.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; font-weight: bold; color: #0F172A; text-align: center;">
            📍 Your Current Location
          </div>
        `);

        userMarkerRef.current = userMarker;
      }

      const bounds = L.latLngBounds([]);

      if (userCoords?.latitude && userCoords?.longitude) {
        bounds.extend([userCoords.latitude, userCoords.longitude]);
      }

      // Add Hospital markers
      hospitals.forEach((hosp) => {
        const isSelected = hosp.hospital_id === selectedHospitalId;
        const isGovt =
          hosp.hospital_type?.toLowerCase().includes("govt") ||
          hosp.hospital_type?.toLowerCase().includes("government");

        const pinColor = isSelected ? "#0D9488" : isGovt ? "#059669" : "#2563EB";
        const pinScale = isSelected ? 1.25 : 1.0;

        const customIcon = L.divIcon({
          className: "hospital-pin-marker",
          html: `
            <div style="
              display: flex;
              align-items: center;
              justify-content: center;
              width: ${isSelected ? 36 : 30}px;
              height: ${isSelected ? 36 : 30}px;
              background: ${pinColor};
              color: #ffffff;
              border: 2.5px solid #ffffff;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg) scale(${pinScale});
              box-shadow: 0 4px 10px rgba(0,0,0,0.25);
              transition: all 0.2s ease;
            ">
              <span style="transform: rotate(45deg); font-size: ${isSelected ? 14 : 11}px; font-weight: bold;">+</span>
            </div>
          `,
          iconSize: [isSelected ? 36 : 30, isSelected ? 36 : 30],
          iconAnchor: [isSelected ? 18 : 15, isSelected ? 36 : 30],
        });

        const marker = L.marker([hosp.latitude, hosp.longitude], {
          icon: customIcon,
          zIndexOffset: isSelected ? 900 : 100,
        }).addTo(map);

        const popupContent = `
          <div style="font-family: inherit; font-size: 12px; max-width: 220px; line-height: 1.4;">
            <div style="font-weight: 700; color: #0F172A; font-size: 13px; margin-bottom: 2px;">
              ${hosp.hospital_name}
            </div>
            <div style="color: #64748B; font-size: 11px; margin-bottom: 6px;">
              ${hosp.hospital_type || "Hospital"} • <b>${
          hosp.distance_km < 1
            ? Math.round(hosp.distance_km * 1000) + " m"
            : hosp.distance_km.toFixed(1) + " km"
        }</b>
            </div>
            <div style="color: #334155; font-size: 11px; margin-bottom: 6px;">
              ${hosp.address}
            </div>
            <a href="${
              hosp.google_maps_url ||
              `https://www.google.com/maps/dir/?api=1&destination=${hosp.latitude},${hosp.longitude}`
            }" target="_blank" rel="noopener noreferrer" style="
              display: inline-block;
              background: #0D9488;
              color: #ffffff;
              padding: 4px 8px;
              border-radius: 6px;
              text-decoration: none;
              font-weight: 600;
              font-size: 10px;
            ">
              Get Directions ↗
            </a>
          </div>
        `;

        marker.bindPopup(popupContent);

        marker.on("click", () => {
          onSelectHospital(hosp);
        });

        markersRef.current[hosp.hospital_id] = marker;
        bounds.extend([hosp.latitude, hosp.longitude]);
      });

      // If a hospital is selected, center on it and open its popup
      if (selectedHospitalId && markersRef.current[selectedHospitalId]) {
        const targetHosp = hospitals.find((h) => h.hospital_id === selectedHospitalId);
        if (targetHosp) {
          map.setView([targetHosp.latitude, targetHosp.longitude], 14, { animate: true });
          markersRef.current[selectedHospitalId].openPopup();
        }
      } else if (bounds.isValid() && hospitals.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
  }, [hospitals, selectedHospitalId, userCoords, isMapReady]);

  // Recenter controls
  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    if (selectedHospitalId && markersRef.current[selectedHospitalId]) {
      const targetHosp = hospitals.find((h) => h.hospital_id === selectedHospitalId);
      if (targetHosp) {
        mapInstanceRef.current.setView([targetHosp.latitude, targetHosp.longitude], 14);
        return;
      }
    }
    if (userCoords?.latitude && userCoords?.longitude) {
      mapInstanceRef.current.setView([userCoords.latitude, userCoords.longitude], 13);
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  const selectedHospital = hospitals.find((h) => h.hospital_id === selectedHospitalId);

  return (
    <div className="w-full h-full min-h-[420px] rounded-2xl overflow-hidden border-2 border-slate-200/80 shadow-xs relative flex flex-col bg-slate-100">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[420px] z-0" />

      {/* Floating Map Controls (Top Right) */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5 shadow-sm">
        <button
          type="button"
          onClick={handleZoomIn}
          className="w-8 h-8 rounded-xl bg-white text-slate-700 hover:text-[#0D9488] hover:bg-slate-50 border border-slate-200 flex items-center justify-center font-bold text-base transition-colors"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="w-8 h-8 rounded-xl bg-white text-slate-700 hover:text-[#0D9488] hover:bg-slate-50 border border-slate-200 flex items-center justify-center font-bold text-base transition-colors"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleRecenter}
          className="w-8 h-8 rounded-xl bg-white text-slate-700 hover:text-[#0D9488] hover:bg-slate-50 border border-slate-200 flex items-center justify-center transition-colors"
          aria-label="Recenter map"
        >
          <Navigation className="w-4 h-4" />
        </button>
      </div>

      {/* Map Header Status (Top Left) */}
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-2 text-xs font-semibold text-slate-800">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Interactive Leaflet Map</span>
        <span className="text-[10px] font-mono text-[#0D9488] bg-[#F0FDFA] px-1.5 py-0.5 rounded font-bold">
          {hospitals.length} pins
        </span>
      </div>

      {/* Selected Hospital Bottom Card overlay */}
      {selectedHospital && (
        <div className="absolute bottom-4 left-4 right-4 z-10 bg-white p-3.5 rounded-2xl border border-[#0D9488]/40 shadow-clinical-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#0D9488] text-white flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="font-heading font-bold text-xs sm:text-sm text-[#0F172A] truncate">
                {selectedHospital.hospital_name}
              </h4>
              <p className="text-[11px] text-[#64748B] font-mono truncate">
                {selectedHospital.distance_km < 1
                  ? `${Math.round(selectedHospital.distance_km * 1000)} m away`
                  : `${selectedHospital.distance_km.toFixed(1)} km away`}
                {selectedHospital.hospital_type ? ` • ${selectedHospital.hospital_type}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenDetail && (
              <button
                type="button"
                onClick={() => onOpenDetail(selectedHospital)}
                className="text-xs font-bold text-[#0D9488] hover:underline px-2 py-1"
              >
                Details
              </button>
            )}

            <a
              href={
                selectedHospital.google_maps_url ||
                `https://www.google.com/maps/dir/?api=1&destination=${selectedHospital.latitude},${selectedHospital.longitude}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <Button variant="primary" size="sm" className="px-3 py-1 text-xs rounded-xl font-bold">
                <span>Directions</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </Button>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
