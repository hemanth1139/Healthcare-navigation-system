"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { HospitalWithDistance } from "@/types/hospital";
import { hospitalApi } from "@/lib/mockHospitalData";
import { HospitalMap } from "@/components/hospitals/HospitalMap";
import { HospitalFilterBar } from "@/components/hospitals/HospitalFilterBar";
import { HospitalList } from "@/components/hospitals/HospitalList";
import { HospitalDetailModal } from "@/components/hospitals/HospitalDetailModal";
import { Spinner } from "@/components/ui/Spinner";
import { Map, List, Navigation } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function HospitalsPage() {
  const searchParams = useSearchParams();
  const initialSpecialist = searchParams?.get("specialist") || "";

  const [hospitals, setHospitals] = useState<HospitalWithDistance[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [specialistFilter, setSpecialistFilter] = useState(initialSpecialist);
  const [maxDistance, setMaxDistance] = useState<number>(0); // 0 = Any
  const [sortBy, setSortBy] = useState<string>("distance");

  // Selection & Modal States
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [detailModalHospital, setDetailModalHospital] = useState<HospitalWithDistance | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");

  useEffect(() => {
    const fetchHospitals = async () => {
      setLoading(true);
      try {
        const data = await hospitalApi.getHospitals(specialistFilter, maxDistance);
        setHospitals(data);
      } catch (err) {
        console.error("Failed to load hospitals", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHospitals();
  }, [specialistFilter, maxDistance]);

  // Process Sorting
  const sortedHospitals = useMemo(() => {
    return [...hospitals].sort((a, b) => {
      if (sortBy === "distance") {
        return a.distance_km - b.distance_km;
      }
      if (sortBy === "time") {
        return parseInt(a.estimated_time) - parseInt(b.estimated_time);
      }
      if (sortBy === "rating") {
        return (b.rating || 0) - (a.rating || 0);
      }
      return 0;
    });
  }, [hospitals, sortBy]);

  const handleSelectHospital = (hosp: HospitalWithDistance) => {
    setSelectedHospitalId(hosp.hospital_id);
  };

  const handleOpenDetail = (hosp: HospitalWithDistance) => {
    setDetailModalHospital(hosp);
  };

  if (loading && hospitals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <Spinner size="lg" color="primary" />
        <span className="text-xs text-[#5C6B6E] mt-2">
          Searching nearby medical facilities & ER trauma centers...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-16 lg:pb-0">
      {/* Page Header */}
      <div className="border-b border-[#E6F4F3] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#1E2A2E] tracking-tight">
            Nearby Hospitals & Medical Centers
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6B6E]">
            Locate 24/7 emergency rooms and specialized care facilities near your position
          </p>
        </div>
      </div>

      {/* Hospital Filter Bar */}
      <HospitalFilterBar
        specialistFilter={specialistFilter}
        onSpecialistChange={setSpecialistFilter}
        maxDistance={maxDistance}
        onDistanceChange={setMaxDistance}
        sortBy={sortBy}
        onSortChange={setSortBy}
        resultCount={sortedHospitals.length}
      />

      {/* Main Content View (Desktop Split Screen, Mobile Toggle) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Sticky Map View (Desktop: 6 cols, Mobile: conditionally visible) */}
        <div
          className={`lg:col-span-6 lg:sticky lg:top-20 lg:h-[calc(100vh-8rem)] ${
            mobileView === "map" ? "block h-[500px]" : "hidden lg:block h-[500px]"
          }`}
        >
          <HospitalMap
            hospitals={sortedHospitals}
            selectedHospitalId={selectedHospitalId}
            onSelectHospital={handleSelectHospital}
          />
        </div>

        {/* Right Scrollable Hospital List (Desktop: 6 cols, Mobile: conditionally visible) */}
        <div
          className={`lg:col-span-6 ${
            mobileView === "list" ? "block" : "hidden lg:block"
          }`}
        >
          <HospitalList
            hospitals={sortedHospitals}
            selectedHospitalId={selectedHospitalId}
            onSelectHospital={handleSelectHospital}
            onOpenDetail={handleOpenDetail}
            onExpandDistance={() => setMaxDistance(25)}
          />
        </div>
      </div>

      {/* Mobile Floating Map/List Toggle Button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <Button
          onClick={() => setMobileView(mobileView === "list" ? "map" : "list")}
          variant="primary"
          size="lg"
          className="shadow-clinical-lg rounded-full px-5 py-3 border-2 border-white"
        >
          {mobileView === "list" ? (
            <>
              <Map className="w-5 h-5 mr-2" />
              <span>View Map</span>
            </>
          ) : (
            <>
              <List className="w-5 h-5 mr-2" />
              <span>View List</span>
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
