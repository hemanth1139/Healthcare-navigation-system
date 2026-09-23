"use client";

import React, { useState, useEffect } from "react";
import {
  HeartPulse,
  Apple,
  Dumbbell,
  Brain,
  ShieldCheck,
  RotateCw,
  UserCheck,
} from "lucide-react";
import { healthTipApi } from "@/lib/mockHealthTipData";
import { HealthTip } from "@/types/healthTip";
import { Spinner } from "@/components/ui/Spinner";

export default function HealthTipsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [tips, setTips] = useState<HealthTip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTips = async () => {
    try {
      const data = await healthTipApi.getTips();
      setTips(data || []);
    } catch (err) {
      console.warn("[HealthTips] Failed to fetch tips:", err);
      setTips([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTips();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTips();
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "nutrition":
        return Apple;
      case "exercise":
        return Dumbbell;
      case "mental health":
        return Brain;
      default:
        return ShieldCheck;
    }
  };

  const filtered = tips.filter(
    (t) => activeCategory === "All" || t.category.toLowerCase() === activeCategory.toLowerCase()
  );

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <HeartPulse className="w-7 h-7 text-[#0D9488]" />
            <span>Personalized Health Tips</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Daily clinical wellness recommendations customized based on your age, gender, and medical history.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="px-4 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 w-fit cursor-pointer"
        >
          <RotateCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>Refresh Tips</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {["All", "Nutrition", "Exercise", "Mental Health", "Preventive Care", "General Wellness"].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeCategory === cat
                ? "bg-[#0D9488] text-white shadow-sm"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tips Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 min-h-[300px] gap-2">
          <Spinner size="lg" color="primary" />
          <span className="text-xs text-slate-400">Loading daily health tips...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-clinical p-12 text-center flex flex-col items-center justify-center gap-3">
          <HeartPulse className="w-10 h-10 text-slate-300" />
          <h3 className="font-heading font-bold text-base text-slate-800 dark:text-slate-200">
            No Tips Available
          </h3>
          <p className="text-xs text-slate-500 max-w-sm">
            {activeCategory === "All"
              ? "No personalized health tips are available at the moment. Complete your profile or triage session to receive customized recommendations."
              : `No tips found in the ${activeCategory} category.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((t) => {
            const Icon = getCategoryIcon(t.category);
            return (
              <div key={t.tip_id} className="card-clinical-interactive p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-[#0D9488] dark:text-[#14B8A6] flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-extrabold uppercase tracking-wider">
                      {t.category}
                    </span>
                  </div>

                  <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white mb-2">
                    {t.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                    {t.summary || t.full_content}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 font-medium text-[#0D9488] dark:text-[#14B8A6]">
                    <UserCheck className="w-3.5 h-3.5" />
                    {t.target_condition ? `Target: ${t.target_condition}` : "Personalized Care"}
                  </span>
                  <span className="font-mono">{t.read_time || "2 min read"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
