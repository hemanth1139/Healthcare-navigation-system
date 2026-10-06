"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { HospitalWithDistance } from "@/types/hospital";
import { hospitalApi, normalizeSpecialty, HospitalSearchResponse } from "@/lib/hospitalApi";
import { HospitalFilterBar } from "@/components/hospitals/HospitalFilterBar";
import { HospitalList } from "@/components/hospitals/HospitalList";
import { HospitalDetailModal } from "@/components/hospitals/HospitalDetailModal";
import { HospitalLoadingSkeleton } from "@/components/hospitals/HospitalLoadingSkeleton";
import { Map, List, AlertCircle, RefreshCw, Building2 } from "lucide-react";
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

export default function HospitalsPage() {
  const searchParams = useSearchParams();
  const rawSpecialist = searchParams?.get("specialty") || searchParams?.get("specialist") || "";
  const initialSpecialist = normalizeSpecialty(rawSpecialist);
  const { t, language } = useLanguage();



  // Filter State
  const [hospitalType, setHospitalType] = useState<string>("All");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>(initialSpecialist);
  const [maxDistance, setMaxDistance] = useState<number>(25);
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

  // Fetch Hospitals from Real Backend API
  // Always shows Thandalam seeded hospitals
  const fetchHospitals = useCallback(async () => {
    setLoading(true);
    setFetchError(null);

    // Always use Thandalam coordinates and demo mode
    const REC_LAT = 13.009644;
    const REC_LON = 80.004336;

    try {
      const response = await hospitalApi.getNearbyHospitals({
        latitude: REC_LAT,
        longitude: REC_LON,
        locationQuery: undefined,
        specialty: specialtyFilter,
        hospitalType: hospitalType,
        maxDistanceKm: maxDistance > 0 ? maxDistance : undefined,
        sortBy: sortBy,
        maxResults: 100,
        demoOnly: true,
      });

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

  // Reset all filters
  const handleResetFilters = () => {
    setHospitalType("All");
    setSpecialtyFilter("");
    setMaxDistance(25);
    setSortBy("distance");
  };

  const handleSelectHospital = (hosp: HospitalWithDistance) => {
    setSelectedHospitalId(hosp.hospital_id);
  };

  const handleOpenDetail = (hosp: HospitalWithDistance) => {
    setDetailModalHospital(hosp);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-16 lg:pb-8">
      {/* Page Title */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-7 shadow-xs">
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
          {t.hospitals || "Nearby Hospitals"}
        </h1>
      </div>

      {/* Filter & Sort Controls */}
      <HospitalFilterBar
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
            userCoords={null}
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
    </div>
  );
}
