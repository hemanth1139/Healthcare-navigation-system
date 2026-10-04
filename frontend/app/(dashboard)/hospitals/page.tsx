"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { HospitalWithDistance } from "@/types/hospital";
import { hospitalApi, normalizeSpecialty, HospitalSearchResponse } from "@/lib/hospitalApi";
import { HospitalSearchBar } from "@/components/hospitals/HospitalSearchBar";
import { HospitalFilterBar } from "@/components/hospitals/HospitalFilterBar";
import { HospitalList } from "@/components/hospitals/HospitalList";
import { HospitalDetailModal } from "@/components/hospitals/HospitalDetailModal";
import { LocationSelectorModal } from "@/components/hospitals/LocationSelectorModal";
import { HospitalLoadingSkeleton } from "@/components/hospitals/HospitalLoadingSkeleton";
import { Map, List, MapPin, AlertCircle, RefreshCw, Navigation, Building2, CheckCircle2, Stethoscope, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";

const HospitalMap = dynamic(
  () => import("@/components/hospitals/HospitalMap"),
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

  // Default to the fixed Thandalam presentation catalogue; users can still
  // select a different area or request GPS from the location dialog.
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: 13.009644,
    longitude: 80.004336,
  });
  const [locationName, setLocationName] = useState<string>("Rajalakshmi Engineering College, Thandalam");
  const [isUsingGps, setIsUsingGps] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true); // Always true to show Thandalam hospitals
  const [isGpsOutsideTn, setIsGpsOutsideTn] = useState<boolean>(false);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);
  const gpsRequestIdRef = useRef(0);

  // Auto-request GPS on mount to get user location for map center, but keep demo mode for hospitals
  useEffect(() => {
    requestGpsLocation();
  }, []);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [hospitalType, setHospitalType] = useState<string>("All");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>(initialSpecialist);
  const [maxDistance, setMaxDistance] = useState<number>(20);
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
  const [searchStatus, setSearchStatus] = useState<{ status: string; message?: string } | null>(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [detailModalHospital, setDetailModalHospital] = useState<HospitalWithDistance | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");

  // Detect GPS Location - Only updates map center, keeps Thandalam hospitals
  const requestGpsLocation = useCallback(() => {
    const requestId = ++gpsRequestIdRef.current;
    setIsLocating(true);
    setFetchError(null);

    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (requestId !== gpsRequestIdRef.current) return;
          const { latitude, longitude } = position.coords;
          setIsLocating(false);

          // Update userCoords for map center only
          setUserCoords({ latitude, longitude });
          setIsUsingGps(true);
          setLocationPermissionDenied(false);

          if (!isCoordWithinTamilNadu(latitude, longitude)) {
            setIsGpsOutsideTn(true);
          }
        },
        (error) => {
          if (requestId !== gpsRequestIdRef.current) return;
          console.warn("[Geolocation] Unavailable or denied:", error.message);
          setIsLocating(false);
          setIsUsingGps(false);
          setIsGpsOutsideTn(false);
          setLocationPermissionDenied(true);
          // Keep Thandalam coordinates as fallback
          setUserCoords({ latitude: 13.009644, longitude: 80.004336 });
        },
        { timeout: 15000, enableHighAccuracy: true, maximumAge: 0 }
      );
    } else {
      setIsLocating(false);
      setLocationPermissionDenied(true);
      // Keep Thandalam coordinates as fallback
      setUserCoords({ latitude: 13.009644, longitude: 80.004336 });
    }
  }, []);

  // Fetch Hospitals from Real Backend API (Always uses Thandalam demo data)
  const fetchHospitals = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    setSearchStatus(null);

    try {
      const response = await hospitalApi.getNearbyHospitals({
        latitude: 13.009644, // Always use Thandalam coordinates for hospitals
        longitude: 80.004336,
        locationQuery: undefined,
        search: searchQuery,
        specialty: specialtyFilter,
        hospitalType: hospitalType,
        maxDistanceKm: maxDistance > 0 ? maxDistance : undefined,
        sortBy: sortBy,
        demoOnly: true, // Always true to show Thandalam hospitals
      });

      // Handle search status messages
      if (response.status && response.status !== "success") {
        setSearchStatus({
          status: response.status,
          message: response.message
        });
      }

      // Filter out any anomalous non-Tamil Nadu response defensively
      const tnOnly = response.hospitals.filter(
        (h) => (h.state || "").toLowerCase() === "tamil nadu" || !h.state
      );

      setHospitals(tnOnly);
      setSelectedHospitalId((selectedId) =>
        tnOnly.some((hospital) => hospital.hospital_id === selectedId)
          ? selectedId
          : tnOnly[0]?.hospital_id ?? null
      );
    } catch (err: any) {
      console.error("[HospitalPage] Error fetching Tamil Nadu hospitals:", err);
      setFetchError(
        err?.response?.data?.detail || "Unable to load nearby Tamil Nadu hospitals right now. Please check connection."
      );
    } finally {
      setLoading(false);
    }
  }, [
    searchQuery,
    specialtyFilter,
    hospitalType,
    maxDistance,
    sortBy,
  ]);

  // Trigger fetch when query parameters update (with 200ms debounce for responsive updates)
  useEffect(() => {
    const timerId = setTimeout(() => {
      fetchHospitals();
    }, 200);
    return () => clearTimeout(timerId);
  }, [fetchHospitals]);

  // Handle Manual Location Selection
  const handleSelectManualLocation = (newLocationText: string) => {
    gpsRequestIdRef.current += 1;
    setIsLocating(false);
    setIsDemoMode(false);
    setIsUsingGps(false);
    setIsGpsOutsideTn(false);
    setLocationPermissionDenied(false);
    setLocationName(newLocationText);
  };

  const useThandalamDemoLocation = () => {
    gpsRequestIdRef.current += 1;
    setIsLocating(false);
    setIsDemoMode(true);
    setIsUsingGps(false);
    setIsGpsOutsideTn(false);
    setLocationPermissionDenied(false);
    setLocationName("Rajalakshmi Engineering College, Thandalam");
    setUserCoords({ latitude: 13.009644, longitude: 80.004336 });
    setMaxDistance(20);
    setSortBy("distance");
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setHospitalType("All");
    setSpecialtyFilter("");
    setMaxDistance(isDemoMode ? 20 : 0);
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
    // Always show Thandalam as the hospital location
    return "Rajalakshmi Engineering College, Thandalam";
  }, []);

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
              <span>{isDemoMode ? "Thandalam Demo Area" : "Tamil Nadu, India"}</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B]">
            {language === "ta"
              ? "தமிழ்நாடு முழுவதும் உள்ள அரசு மற்றும் முன்னணி சிறப்பு மருத்துவமனைகளைக் கண்டறியவும்."
              : "Showing hospitals near Rajalakshmi Engineering College, Thandalam. Map centered on your location."}
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
                {isUsingGps ? "Map: Your GPS Location" : "Map: Default Location"}
              </span>
              <span className="text-xs font-bold text-slate-800 max-w-[160px] sm:max-w-[210px] truncate">
                Hospitals: Thandalam
              </span>
            </div>
          </div>

          <Button
            type="button"
            onClick={requestGpsLocation}
            disabled={isLocating}
            variant="secondary"
            size="sm"
            className="rounded-xl text-xs font-bold shrink-0 border-slate-200"
          >
            <Navigation className={`w-3.5 h-3.5 mr-1 ${isLocating ? "animate-spin" : ""}`} />
            <span>{isLocating ? "Locating..." : "Center Map on You"}</span>
          </Button>
        </div>
      </div>

      {/* GPS Location Info Banner */}
      {isUsingGps && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Map centered on your GPS location. Showing hospitals near <b>Rajalakshmi Engineering College, Thandalam</b>.
            </span>
          </div>
        </div>
      )}

      {/* Location Permission Denied Banner */}
      {locationPermissionDenied && !isUsingGps && (
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#0D9488] shrink-0" />
            <span>
              GPS permission denied. Map centered on default location. Showing hospitals near <b>Rajalakshmi Engineering College, Thandalam</b>.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={requestGpsLocation}
              disabled={isLocating}
              className="px-2.5 py-1 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Navigation className={`w-3 h-3 ${isLocating ? "animate-spin" : ""}`} />
              <span>{isLocating ? "Requesting..." : "Enable GPS"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Search Input Bar */}
      <HospitalSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={() => fetchHospitals()}
      />

      {/* Filter & Sort Controls - District selector disabled as we always show Thandalam hospitals */}
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

      {/* Search Status Banner (Fallback/Partial Results) */}
      {searchStatus && searchStatus.status !== "success" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold text-sm">
                {searchStatus.status === "fallback" ? "Using cached hospital data" : "Partial search results"}
              </span>
              <span className="text-xs text-amber-700">{searchStatus.message || "Live data unavailable. Showing results from database."}</span>
            </div>
          </div>
          <Button
            type="button"
            onClick={fetchHospitals}
            variant="secondary"
            size="sm"
            className="rounded-xl border-amber-200 text-amber-800 hover:bg-amber-100 font-bold shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            <span>Retry</span>
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
            userCoords={isUsingGps || isDemoMode ? userCoords : null}
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
