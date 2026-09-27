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
  AlertTriangle,
  Info,
  Clock,
  Sparkles,
  Stethoscope,
  Pill,
} from "lucide-react";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui/Spinner";

interface LiveHealthTip {
  tipId: string;
  title: string;
  content: string;
  category: string;
  targetCondition?: string;
  escalationGuidance?: string;
  readTime?: string;
  createdAt?: string;
}

export default function HealthTipsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [tips, setTips] = useState<LiveHealthTip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTips = async () => {
    try {
      setError(null);
      const res = await api.get("/tips/daily");
      const data = res.data || [];
      const mapped: LiveHealthTip[] = data.map((t: any, idx: number) => ({
        tipId: t.tipId || t.tip_id || `tip-${idx}`,
        title: t.title || "Clinical Wellness Tip",
        content: t.content || t.summary || "",
        category: t.category || "General Wellness",
        targetCondition: t.targetCondition || t.target_condition || "Preventive Care",
        escalationGuidance: t.escalationGuidance || t.escalation_guidance || "Consult your physician if symptoms worsen.",
        readTime: t.readTime || t.read_time || "2 min read",
        createdAt: t.createdAt || t.created_at,
      }));
      setTips(mapped);
    } catch (err: any) {
      console.warn("[HealthTips] Failed to fetch tips from backend:", err);
      setError("Unable to generate health recommendations. Please verify your connection.");
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
    const cat = (category || "").toLowerCase();
    if (cat.includes("nutr") || cat.includes("diet")) return Apple;
    if (cat.includes("phys") || cat.includes("activ") || cat.includes("exerc")) return Dumbbell;
    if (cat.includes("med") || cat.includes("pharm")) return Pill;
    if (cat.includes("seek") || cat.includes("emerg") || cat.includes("urgent")) return Stethoscope;
    if (cat.includes("prev")) return ShieldCheck;
    return HeartPulse;
  };

  const categories = [
    "All",
    "General Wellness",
    "Preventive Care",
    "Medication Safety",
    "When to Seek Care",
    "Nutrition",
    "Physical Activity",
  ];

  const filtered = tips.filter(
    (t) => activeCategory === "All" || (t.category || "").toLowerCase() === activeCategory.toLowerCase()
  );

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <HeartPulse className="w-7 h-7 text-[#0D9488]" />
            <span>Personalized Health & Wellness Guidance</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Preventive clinical wellness recommendations adapted to your age, allergies, and chronic health profile.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
          className="px-4 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-2 w-fit cursor-pointer self-start sm:self-auto"
        >
          <RotateCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>{isRefreshing ? "Updating..." : "Refresh Guidance"}</span>
        </button>
      </div>

      {/* Mandatory Non-Diagnostic Clinical Safety Banner */}
      <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-4.5 flex items-start gap-3 shadow-xs">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
            Clinical Disclaimer & Preventive Scope
          </p>
          <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
            The guidance provided here is for general health promotion and preventive education. It is not a definitive diagnosis or medical prescription. If you experience severe, acute, or worsening symptoms, consult a licensed healthcare practitioner or contact emergency medical services immediately.
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeCategory === cat
                ? "bg-[#0D9488] text-white shadow-xs"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tips Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 min-h-[300px] gap-3">
          <Spinner size="lg" color="primary" />
          <span className="text-xs text-slate-500">Generating personalized clinical wellness guidance...</span>
        </div>
      ) : error ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 max-w-md mx-auto">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Unable to Load Health Tips</h3>
          <p className="text-xs text-slate-500">{error}</p>
          <button
            onClick={fetchTips}
            className="px-4 py-2 bg-[#0D9488] text-white text-xs font-semibold rounded-xl"
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 max-w-md mx-auto">
          <Sparkles className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">No Tips in This Category</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No specific guidance items found for &quot;{activeCategory}&quot;.
          </p>
          <button
            onClick={() => setActiveCategory("All")}
            className="text-xs font-bold text-[#0D9488] hover:underline"
          >
            View All Guidance Categories
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((t) => {
            const Icon = getCategoryIcon(t.category);
            return (
              <div
                key={t.tipId}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-5 hover:border-teal-500/40 transition-colors"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-11 h-11 rounded-xl bg-teal-500/10 text-[#0D9488] dark:text-[#14B8A6] flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                      {t.category}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {t.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-2">
                      {t.content}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  {/* Escalation Guidance Box */}
                  {t.escalationGuidance && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2">
                      <Stethoscope className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block text-[10px] uppercase tracking-wider">
                          When to Consult a Physician
                        </span>
                        <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-normal">
                          {t.escalationGuidance}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 font-medium text-[#0D9488] dark:text-[#14B8A6]">
                      <UserCheck className="w-3.5 h-3.5" />
                      {t.targetCondition || "Personalized Guidance"}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[10px]">
                      <Clock className="w-3 h-3" />
                      {t.readTime || "2 min read"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
