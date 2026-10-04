"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { HospitalWithDistance } from "@/types/hospital";
import { Navigation, ZoomIn, ZoomOut, ExternalLink, Building2, LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { hospitalApi } from "@/lib/hospitalApi";

export interface HospitalMapProps {
  hospitals: HospitalWithDistance[];
  selectedHospitalId?: string | null;
  userCoords?: { latitude: number; longitude: number } | null;
  onSelectHospital: (hospital: HospitalWithDistance) => void;
  onOpenDetail?: (hospital: HospitalWithDistance) => void;
}

function getSafeDirectionsUrl(hospital: HospitalWithDistance): string {
  const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`;
  try {
    const suppliedUrl = new URL(hospital.google_maps_url || fallbackUrl);
    const allowedHosts = new Set(["www.google.com", "maps.google.com", "openstreetmap.org", "www.openstreetmap.org"]);
    return suppliedUrl.protocol === "https:" && allowedHosts.has(suppliedUrl.hostname)
      ? suppliedUrl.toString()
      : fallbackUrl;
  } catch {
    return fallbackUrl;
  }
}

function createHospitalPopup(hospital: HospitalWithDistance): HTMLElement {
  const root = document.createElement("div");
  root.style.cssText = "font-family: sans-serif; font-size: 12px; max-width: 220px; line-height: 1.4;";

  const title = document.createElement("div");
  title.textContent = hospital.hospital_name;
  title.style.cssText = "font-weight: 700; color: #0F172A; font-size: 13px; margin-bottom: 2px;";
  root.appendChild(title);

  const details = document.createElement("div");
  const distance = hospital.distance_km < 1
    ? `${Math.round(hospital.distance_km * 1000)} m`
    : `${hospital.distance_km.toFixed(1)} km`;
  details.textContent = `${hospital.hospital_type || "Hospital"} · ${distance}`;
  details.style.cssText = "color: #64748B; font-size: 11px; margin-bottom: 6px;";
  root.appendChild(details);

  const address = document.createElement("div");
  address.textContent = hospital.address || "Address not available";
  address.style.cssText = "color: #334155; font-size: 11px; margin-bottom: 6px;";
  root.appendChild(address);

  const directions = document.createElement("a");
  directions.href = getSafeDirectionsUrl(hospital);
  directions.target = "_blank";
  directions.rel = "noopener noreferrer";
  directions.textContent = "Get directions ↗";
  directions.style.cssText = "display:inline-block;background:#0D9488;color:white;padding:4px 8px;border-radius:6px;text-decoration:none;font-weight:600;font-size:10px;";
  root.appendChild(directions);
  return root;
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
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [routePreview, setRoutePreview] = useState<"idle" | "loading" | "road" | "estimated">("idle");
  const [routePreviewTime, setRoutePreviewTime] = useState<string | null>(null);

  // Initialize Leaflet Map — intentionally runs only once on mount.
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Default center: userCoords (GPS location) or first hospital or Chennai
    // Note: userCoords is used for map center, hospitals are plotted at their actual locations
    const initialLat =
      userCoords?.latitude ?? (hospitals.length > 0 ? hospitals[0].latitude : 13.0827);
    const initialLng =
      userCoords?.longitude ?? (hospitals.length > 0 ? hospitals[0].longitude : 80.2707);

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 12,
      zoomControl: false,
    });

    // OpenStreetMap standard tiles (100% free, no API key required, no watermark)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;
    setIsMapReady(true);

    // Initial resize to ensure tiles render even if container layout settled after mount
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);

    // Observe container size changes (e.g. responsive layout, mobile/desktop toggle)
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      clearTimeout(timer);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      setIsMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update Markers when hospitals, selectedHospitalId, or userCoords change
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Close any open popups before removing markers to prevent _leaflet_pos error
    try {
      map.closePopup();
    } catch (e) {
      // Ignore popup close errors
    }

    // Clear previous hospital markers
    Object.values(markersRef.current).forEach((marker) => {
      try {
        marker.remove();
      } catch (e) {
        // Ignore marker removal errors
      }
    });
    markersRef.current = {};

    if (userMarkerRef.current) {
      try {
        userMarkerRef.current.remove();
      } catch (e) {
        // Ignore marker removal errors
      }
      userMarkerRef.current = null;
    }

      // Plot User location if available
      if (userCoords?.latitude != null && userCoords?.longitude != null) {
        try {
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
        } catch (e) {
          console.warn("[HospitalMap] Failed to add user marker:", e);
        }
      }

      const bounds = L.latLngBounds([]);

      if (userCoords?.latitude != null && userCoords?.longitude != null) {
        bounds.extend([userCoords.latitude, userCoords.longitude]);
      }

      // Add Hospital markers
      hospitals.forEach((hosp) => {
        try {
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
          marker.bindPopup(createHospitalPopup(hosp));

          marker.on("click", () => {
            onSelectHospital(hosp);
          });

          markersRef.current[hosp.hospital_id] = marker;
          bounds.extend([hosp.latitude, hosp.longitude]);
        } catch (e) {
          console.warn("[HospitalMap] Failed to add marker for hospital:", hosp.hospital_name, e);
        }
      });

      // If a hospital is selected, center on it and open its popup
      if (selectedHospitalId && markersRef.current[selectedHospitalId]) {
        const targetHosp = hospitals.find((h) => h.hospital_id === selectedHospitalId);
        if (targetHosp) {
          try {
            map.setView([targetHosp.latitude, targetHosp.longitude], 14, { animate: true });
            setTimeout(() => {
              if (markersRef.current[selectedHospitalId]) {
                try {
                  markersRef.current[selectedHospitalId].openPopup();
                } catch (e) {
                  console.warn("[HospitalMap] Failed to open popup:", e);
                }
              }
            }, 100);
          } catch (e) {
            console.warn("[HospitalMap] Failed to set view on selected hospital:", e);
          }
        }
      } else if (bounds.isValid() && hospitals.length > 0) {
        try {
          map.invalidateSize();
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
        } catch (e) {
          console.warn("[HospitalMap] Failed to fit bounds:", e);
        }
      }
  }, [hospitals, selectedHospitalId, userCoords, isMapReady, onSelectHospital]);

  // Preview a real road route for the selected hospital when GPS coordinates
  // are available. Without GPS, keep the distance-based time clearly labelled
  // as an estimate.
  useEffect(() => {
    const map = mapInstanceRef.current;
    routeLayerRef.current?.remove();
    routeLayerRef.current = null;

    const selected = hospitals.find((hospital) => hospital.hospital_id === selectedHospitalId);
    if (!isMapReady || !map || !selected) {
      setRoutePreview("idle");
      setRoutePreviewTime(null);
      return;
    }
    if (userCoords?.latitude == null || userCoords?.longitude == null) {
      setRoutePreview("estimated");
      setRoutePreviewTime(selected.estimated_time || null);
      return;
    }

    let cancelled = false;
    setRoutePreview("loading");
    setRoutePreviewTime(null);
    hospitalApi.getRoute(
      userCoords.latitude,
      userCoords.longitude,
      selected.latitude,
      selected.longitude,
    ).then((route) => {
      if (cancelled) return;
      const coordinates = route?.geometry?.coordinates;
      if (Array.isArray(coordinates) && coordinates.length > 1) {
        const points = coordinates
          .filter((point) => Number.isFinite(point[0]) && Number.isFinite(point[1]))
          .map(([longitude, latitude]) => [latitude, longitude] as L.LatLngTuple);
        if (points.length > 1) {
          routeLayerRef.current = L.polyline(points, {
            color: "#0D9488",
            weight: 5,
            opacity: 0.85,
            lineCap: "round",
            lineJoin: "round",
          }).addTo(map);
          map.fitBounds(routeLayerRef.current.getBounds(), {
            padding: [50, 50],
            maxZoom: 14,
          });
          setRoutePreview("road");
          setRoutePreviewTime(route?.estimated_time || selected.estimated_time || null);
          return;
        }
      }
      setRoutePreview("estimated");
      setRoutePreviewTime(selected.estimated_time || null);
    }).catch(() => {
      if (!cancelled) {
        setRoutePreview("estimated");
        setRoutePreviewTime(selected.estimated_time || null);
      }
    });

    return () => {
      cancelled = true;
      routeLayerRef.current?.remove();
      routeLayerRef.current = null;
    };
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
    if (userCoords?.latitude != null && userCoords?.longitude != null) {
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

      {/* Map marker legend */}
      <div className="absolute top-14 left-4 z-10 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200/80 shadow-sm flex flex-col gap-1.5 text-[10px] font-semibold text-slate-700">
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-teal-600" />Your location</div>
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />Government hospital</div>
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-600" />Other hospital</div>
        <div className="flex items-center gap-2"><span className="w-4 border-t-2 border-teal-600" />Selected route</div>
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
              <p className="text-[10px] text-slate-500 flex items-center gap-1">
                {routePreview === "loading" ? (
                  "Loading road route…"
                ) : routePreview === "road" ? (
                  <><LocateFixed className="w-3 h-3" /> Road route{routePreviewTime ? ` · ${routePreviewTime}` : ""}</>
                ) : (
                  <>Estimated time{routePreviewTime ? ` · ${routePreviewTime}` : ""}</>
                )}
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
              href={getSafeDirectionsUrl(selectedHospital)}
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

export default HospitalMap;

