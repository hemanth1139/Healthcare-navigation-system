"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { HospitalWithDistance } from "@/types/hospital";
import { hospitalApi, normalizeSpecialty } from "@/lib/hospitalApi";
import { HospitalSearchBar } from "@/components/hospitals/HospitalSearchBar";
import { HospitalFilterBar } from "@/components/hospitals/HospitalFilterBar";
import { HospitalList } from "@/components/hospitals/HospitalList";
import { HospitalDetailModal } from "@/components/hospitals/HospitalDetailModal";
import { LocationSelectorModal } from "@/components/hospitals/LocationSelectorModal";
import { HospitalLoadingSkeleton } from "@/components/hospitals/HospitalLoadingSkeleton";
import { Map, List, MapPin, AlertCircle, RefreshCw, Navigation, Building2, CheckCircle2, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";

const HospitalMap = dynamic(
  () => import("@/components/hospitals/HospitalMap").then((mod) => mod.HospitalMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[420px] rounded-2xl flex flex-col items-center justify-center bg-slate-100 border border-slate-200 text-slate-500 gap-3">
        <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Loading interactive map...</p>
      </div>
    ),
  }
);

// Tamil Nadu Bounding Box Validation Helper (Client-side)
const isCoordWithinTamilNadu = (lat: number, lng: number) => {
  return lat >= 8.0 && lat <= 13.75 && lng >= 76.10 && lng <= 80.40;
};

export default function HospitalsPage() {
  const searchParams = useSearchParams();
  const rawSpecialist = searchParams?.get("specialty") || searchParams?.get("specialist") || "";
  const initialSpecialist = normalizeSpecialty(rawSpecialist);
  const { t, language } = useLanguage();

  // Location State (Default: Chennai, Tamil Nadu)
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationName, setLocationName] = useState<string>("Chennai, Tamil Nadu");
  const [isUsingGps, setIsUsingGps] = useState<boolean>(false);
  const [isGpsOutsideTn, setIsGpsOutsideTn] = useState<boolean>(false);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [hospitalType, setHospitalType] = useState<string>("All");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>(initialSpecialist);
  const [maxDistance, setMaxDistance] = useState<number>(0); // 0 = Any Distance
  const [sortBy, setSortBy] = useState<string>("distance");

  // React to URL query parameter changes on client navigation
  useEffect(() => {
    const raw = searchParams?.get("specialty") || searchParams?.get("specialist") || "";
    if (raw) {
      setSpecialtyFilter(normalizeSpecialty(raw));
    }
  }, [searchParams]);

  // Data & UI State
  const [hospitals, setHospitals] = useState<HospitalWithDistance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [detailModalHospital, setDetailModalHospital] = useState<HospitalWithDistance | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");

  // Detect GPS Location
  const requestGpsLocation = useCallback(() => {
    setIsLocating(true);
    setFetchError(null);

    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setIsLocating(false);

          if (isCoordWithinTamilNadu(latitude, longitude)) {
            setUserCoords({ latitude, longitude });
            setIsUsingGps(true);
            setIsGpsOutsideTn(false);
            setLocationPermissionDenied(false);
            setLocationName("Live GPS (Tamil Nadu)");
          } else {
            // Outside Tamil Nadu
            setUserCoords({ latitude, longitude });
            setIsUsingGps(false);
            setIsGpsOutsideTn(true);
            setLocationPermissionDenied(false);
            setLocationName("Chennai, Tamil Nadu (Default Hub)");
          }
        },
        (error) => {
          console.warn("[Geolocation] Unavailable or denied:", error.message);
          setIsLocating(false);
          setIsUsingGps(false);
          setIsGpsOutsideTn(false);
          setLocationPermissionDenied(true);
          setLocationName("Chennai, Tamil Nadu");
          setUserCoords({ latitude: 13.0827, longitude: 80.2707 });
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      setIsLocating(false);
      setLocationPermissionDenied(true);
      setLocationName("Chennai, Tamil Nadu");
      setUserCoords({ latitude: 13.0827, longitude: 80.2707 });
    }
  }, []);

  // Request location once on mount
  useEffect(() => {
    requestGpsLocation();
  }, [requestGpsLocation]);

  // Fetch Hospitals from Real Backend API (Strictly Tamil Nadu)
  const fetchHospitals = useCallback(async () => {
    setLoading(true);
    setFetchError(null);

    try {
      const data = await hospitalApi.getNearbyHospitals({
        latitude: isUsingGps && userCoords ? userCoords.latitude : undefined,
        longitude: isUsingGps && userCoords ? userCoords.longitude : undefined,
        locationQuery: !isUsingGps ? locationName : undefined,
        search: searchQuery,
        specialty: specialtyFilter,
        hospitalType: hospitalType,
        maxDistanceKm: maxDistance > 0 ? maxDistance : undefined,
        sortBy: sortBy,
      });

      // Filter out any anomalous non-Tamil Nadu response defensively
      const tnOnly = data.filter(
        (h) => (h.state || "").toLowerCase() === "tamil nadu" || !h.state
      );

      setHospitals(tnOnly);
      if (tnOnly.length > 0 && !selectedHospitalId) {
        setSelectedHospitalId(tnOnly[0].hospital_id);
      }
    } catch (err: any) {
      console.error("[HospitalPage] Error fetching Tamil Nadu hospitals:", err);
      setFetchError(
        err?.response?.data?.detail || "Unable to load nearby Tamil Nadu hospitals right now. Please check connection."
      );
    } finally {
      setLoading(false);
    }
  }, [
    userCoords,
    isUsingGps,
    locationName,
    searchQuery,
    specialtyFilter,
    hospitalType,
    maxDistance,
    sortBy,
  ]);

  // Trigger fetch when query parameters update
  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  // Handle Manual Location Selection
  const handleSelectManualLocation = (newLocationText: string) => {
    setIsUsingGps(false);
    setIsGpsOutsideTn(false);
    setLocationPermissionDenied(false);
    setLocationName(newLocationText);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setHospitalType("All");
    setSpecialtyFilter("");
    setMaxDistance(0);
    setSortBy("distance");
  };

  const handleSelectHospital = (hosp: HospitalWithDistance) => {
    setSelectedHospitalId(hosp.hospital_id);
  };

  const handleOpenDetail = (hosp: HospitalWithDistance) => {
    setDetailModalHospital(hosp);
  };

  // Compute clean scope label for display
  const activeScopeDisplay = useMemo(() => {
    if (isUsingGps) return "Your GPS Position (Tamil Nadu)";
    return locationName || "Chennai, Tamil Nadu";
  }, [isUsingGps, locationName]);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-16 lg:pb-8">
      {/* Page Header with Tamil Nadu Scope Indicator */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center flex-wrap gap-2.5">
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              {t.hospitals || "Nearby Hospitals"}
            </h1>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D9488] bg-[#F0FDFA] px-3 py-1 rounded-full border border-[#0D9488]/20 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>Tamil Nadu, India</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B]">
            {language === "ta"
              ? "தமிழ்நாடு முழுவதும் உள்ள அரசு மற்றும் முன்னணி சிறப்பு மருத்துவமனைகளைக் கண்டறியவும்."
              : "Find verified government medical colleges, trauma centers, and specialized hospitals across Tamil Nadu."}
          </p>
        </div>

        {/* Location Status & Change Location Button */}
        <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 p-2 sm:p-2.5 rounded-2xl shrink-0">
          <div className="flex items-center gap-2 pl-2">
            <div
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                isUsingGps ? "bg-emerald-500 animate-pulse" : "bg-[#0D9488]"
              }`}
            />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isUsingGps ? "Live GPS Active" : "Selected District"}
              </span>
              <span className="text-xs font-bold text-slate-800 max-w-[160px] sm:max-w-[210px] truncate">
                {locationName}
              </span>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            variant="secondary"
            size="sm"
            className="rounded-xl text-xs font-bold shrink-0 border-slate-200"
          >
            <MapPin className="w-3.5 h-3.5 mr-1 text-[#0D9488]" />
            <span>Change</span>
          </Button>
        </div>
      </div>

      {/* GPS Outside Tamil Nadu Notification */}
      {isGpsOutsideTn && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Your current device location is outside Tamil Nadu. The directory is currently focused on hospitals in <b>Tamil Nadu, India</b>.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSelectManualLocation("Chennai, Tamil Nadu")}
              className="font-bold underline text-amber-800 hover:text-amber-950 cursor-pointer"
            >
              View Chennai Hospitals
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleSelectManualLocation("All Tamil Nadu")}
              className="font-bold underline text-amber-800 hover:text-amber-950 cursor-pointer"
            >
              All Tamil Nadu
            </button>
          </div>
        </div>
      )}

      {/* Location Permission Denied Warning */}
      {locationPermissionDenied && !isUsingGps && !isGpsOutsideTn && (
        <div className="bg-slate-100 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#0D9488] shrink-0" />
            <span>
              Showing healthcare facilities for <b>{locationName}</b>. Select a specific district or Chennai locality below.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="font-bold text-[#0D9488] hover:underline cursor-pointer text-left"
          >
            Choose District / Area →
          </button>
        </div>
      )}

      {/* Search Input Bar */}
      <HospitalSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={() => fetchHospitals()}
      />

      {/* Filter & Sort Controls with Integrated District Selector */}
      <HospitalFilterBar
        selectedDistrict={locationName}
        onDistrictChange={handleSelectManualLocation}
        hospitalType={hospitalType}
        onHospitalTypeChange={setHospitalType}
        specialty={specialtyFilter}
        onSpecialtyChange={setSpecialtyFilter}
        maxDistance={maxDistance}
        onDistanceChange={setMaxDistance}
        sortBy={sortBy}
        onSortChange={setSortBy}
        resultCount={hospitals.length}
        onResetFilters={handleResetFilters}
      />

      {/* Active Scope Summary Banner */}
      <div className="flex items-center justify-between bg-slate-50 border border-slate-200/60 px-4 py-2.5 rounded-xl text-xs">
        <div className="flex items-center gap-2 text-slate-700 font-medium">
          <span className="text-[#64748B]">Showing hospitals in:</span>
          <span className="font-bold text-[#0F172A] bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
            {activeScopeDisplay}
          </span>
        </div>
        <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          State: Tamil Nadu
        </span>
      </div>

      {/* Active Specialty Indicator Banner */}
      {specialtyFilter && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 px-4 py-3 rounded-2xl text-xs text-teal-900 dark:text-teal-200 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-[#0D9488] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <span>
                Targeted Specialty: <strong className="text-teal-950 dark:text-white font-bold">{specialtyFilter} Department</strong>
              </span>
              <p className="text-[11px] text-teal-700 dark:text-teal-300 mt-0.5">
                Displaying <b>{hospitals.length}</b> verified healthcare facilities with active {specialtyFilter.toLowerCase()} services.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSpecialtyFilter("")}
            className="text-xs font-bold text-[#0D9488] dark:text-[#14B8A6] hover:underline cursor-pointer shrink-0 self-start sm:self-center"
          >
            Clear Specialty Filter
          </button>
        </div>
      )}

      {/* Error State Banner */}
      {fetchError && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-900">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold text-sm">Unable to load nearby hospitals</span>
              <span className="text-xs text-rose-700">{fetchError}</span>
            </div>
          </div>
          <Button
            type="button"
            onClick={fetchHospitals}
            variant="secondary"
            size="sm"
            className="rounded-xl border-rose-200 text-rose-800 hover:bg-rose-100 font-bold shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            <span>Try Again</span>
          </Button>
        </div>
      )}

      {/* Main Grid: Left List (6 cols), Right Sticky Map (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Hospital Results List */}
        <div
          className={`lg:col-span-6 flex flex-col gap-4 ${
            mobileView === "list" ? "block" : "hidden lg:block"
          }`}
        >
          {loading ? (
            <HospitalLoadingSkeleton />
          ) : (
            <HospitalList
              hospitals={hospitals}
              selectedHospitalId={selectedHospitalId}
              activeSpecialty={specialtyFilter}
              onSelectHospital={handleSelectHospital}
              onOpenDetail={handleOpenDetail}
              onExpandDistance={() => setMaxDistance(50)}
              onChangeLocation={() => setIsLocationModalOpen(true)}
              onClearFilters={handleResetFilters}
            />
          )}
        </div>

        {/* Right Column: Interactive Map */}
        <div
          className={`lg:col-span-6 lg:sticky lg:top-20 lg:h-[calc(100vh-8rem)] ${
            mobileView === "map" ? "block h-[500px]" : "hidden lg:block h-[580px]"
          }`}
        >
          <HospitalMap
            hospitals={hospitals}
            selectedHospitalId={selectedHospitalId}
            userCoords={isUsingGps ? userCoords : null}
            onSelectHospital={handleSelectHospital}
            onOpenDetail={handleOpenDetail}
          />
        </div>
      </div>

      {/* Mobile Floating View Switcher */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <Button
          onClick={() => setMobileView(mobileView === "list" ? "map" : "list")}
          variant="primary"
          size="lg"
          className="shadow-xl rounded-full px-5 py-3 border-2 border-white font-bold"
        >
          {mobileView === "list" ? (
            <>
              <Map className="w-5 h-5 mr-2" />
              <span>Show Map View</span>
            </>
          ) : (
            <>
              <List className="w-5 h-5 mr-2" />
              <span>Show Hospital List</span>
            </>
          )}
        </Button>
      </div>

      {/* Hospital Detail Modal */}
      <HospitalDetailModal
        isOpen={!!detailModalHospital}
        onClose={() => setDetailModalHospital(null)}
        hospital={detailModalHospital}
      />

      {/* Location Selector Modal */}
      <LocationSelectorModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentLocationName={locationName}
        isUsingGps={isUsingGps}
        onSelectManualLocation={handleSelectManualLocation}
        onRequestGpsLocation={requestGpsLocation}
        isLocating={isLocating}
      />
    </div>
  );
}
