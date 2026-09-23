"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Clock,
  Search,
  Filter,
  Calendar,
  Stethoscope,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  FileText,
  ArrowRight,
  Activity,
} from "lucide-react";

import { api } from "@/lib/api";

interface HistoryItem {
  id: string;
  date: string;
  symptom: string;
  severity: string;
  severityBadge: string;
  predictedDisease: string;
  specialist: string;
}

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("All");
  const [timelineItems, setTimelineItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    let isMounted = true;
    api
      .get("/history")
      .then(({ data }) => {
        if (!isMounted) return;
        if (Array.isArray(data)) {
          const items: HistoryItem[] = data.map((item: any) => {
            const dateStr = item.predictedAt
              ? new Date(item.predictedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Recent";
            const score = item.confidenceScore || 0;
            const severity = score > 0.8 ? "Urgent" : score > 0.5 ? "Moderate" : "Routine";
            const severityBadge =
              severity === "Urgent"
                ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30"
                : severity === "Moderate"
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";

            return {
              id: item.predictionId || item.conversationId,
              date: dateStr,
              symptom: item.predictedDisease || "Symptom Assessment",
              severity,
              severityBadge,
              predictedDisease: item.predictedDisease || "Assessment Pending",
              specialist: "Clinical Specialist",
            };
          });
          setTimelineItems(items);
        }
      })
      .catch((err) => {
        console.warn("[History] Failed to fetch assessment history:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = timelineItems.filter((item) => {
    const matchesSearch =
      item.symptom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.predictedDisease.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity =
      selectedSeverity === "All" || item.severity.toLowerCase() === selectedSeverity.toLowerCase();
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Clock className="w-7 h-7 text-[#0D9488]" />
            <span>Consultation & Triage History</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete interactive timeline of past AI symptom checks, severity ratings, and specialist recommendations.
          </p>
        </div>

        <Link
          href="/symptom-chat"
          className="px-5 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 w-fit"
        >
          <Stethoscope className="w-4 h-4" />
          <span>New Symptom Check</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="card-clinical p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by symptom or disease..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-[#0D9488]"
          />
        </div>

        {/* Severity Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {["All", "Emergency", "Urgent", "Non-urgent", "Routine"].map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedSeverity === sev
                  ? "bg-[#0D9488] text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Vertical Timeline View */}
      {filtered.length === 0 ? (
        <div className="card-clinical p-12 text-center flex flex-col items-center justify-center gap-3">
          <Clock className="w-10 h-10 text-slate-300" />
          <h3 className="font-heading font-bold text-base text-slate-800 dark:text-slate-200">No Consultations Found</h3>
          <p className="text-xs text-slate-500 max-w-sm">No past consultations match your search filter criteria.</p>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 border-l-2 border-teal-500/30 flex flex-col gap-8 my-2">
          {filtered.map((item) => (
            <div key={item.id} className="relative group">
              {/* Timeline Dot */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full bg-[#0D9488] border-4 border-white dark:border-[#030712] shadow-md group-hover:scale-125 transition-all" />

              {/* Content Card */}
              <div className="card-clinical-interactive p-6 flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#0D9488]" />
                    {item.date}
                  </span>
                  <span className={`px-3 py-0.5 rounded-full text-[10px] font-extrabold border w-fit ${item.severityBadge}`}>
                    {item.severity}
                  </span>
                </div>

                <div>
                  <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                    {item.symptom}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Predicted Condition: <strong className="text-[#0D9488] dark:text-[#14B8A6]">{item.predictedDisease}</strong>
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    Recommended Specialist: <strong className="text-slate-700 dark:text-slate-300">{item.specialist}</strong>
                  </span>

                  <Link
                    href={`/predictions/${item.id}`}
                    className="px-4 py-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-[#0D9488] dark:text-[#14B8A6] font-bold text-xs transition-colors flex items-center gap-1 w-fit"
                  >
                    <span>View Full Report</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

