"use client";

import React, { useState, useEffect } from "react";
import { HealthTip, HealthTipCategory } from "@/types/healthTip";
import { healthTipApi } from "@/lib/mockHealthTipData";
import { HealthTipFilterChips } from "@/components/health-tips/HealthTipFilterChips";
import { HealthTipGrid } from "@/components/health-tips/HealthTipGrid";
import { Spinner } from "@/components/ui/Spinner";
import { Sparkles, HeartPulse } from "lucide-react";

export default function HealthTipsPage() {
  const [tips, setTips] = useState<HealthTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<HealthTipCategory | "All">("All");

  useEffect(() => {
    const fetchTips = async () => {
      setLoading(true);
      try {
        const data = await healthTipApi.getTips(selectedCategory, true);
        setTips(data);
      } catch (err) {
        console.error("Failed to load health tips", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTips();
  }, [selectedCategory]);

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto py-2">
      {/* Page Header */}
      <div className="border-b border-[#E6F4F3] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-[#0F6E7A] px-2.5 py-0.5 rounded-full">
              Personalized Guidance
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#1E2A2E] tracking-tight mt-1">
            Health Tips & Preventive Advisories
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6B6E]">
            Evidence-based wellness, nutrition, and seasonal advisories personalized based on your health profile
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#E6F4F3] px-3.5 py-2 rounded-xl text-xs font-semibold text-[#0F6E7A] w-fit">
          <HeartPulse className="w-4 h-4" />
          <span>Tailored for your profile</span>
        </div>
      </div>

      {/* Category Filter Chips */}
      <HealthTipFilterChips
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        showChronicCategory={true}
      />

      {/* Health Tips Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 min-h-[300px]">
          <Spinner size="lg" color="primary" />
          <span className="text-xs text-[#5C6B6E] mt-2">Loading preventive health advisories...</span>
        </div>
      ) : (
        <HealthTipGrid tips={tips} />
      )}
    </div>
  );
}
