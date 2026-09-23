"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  AlertTriangle,
  Stethoscope,
  Building2,
  CheckCircle2,
  Activity,
  Tag,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui/Spinner";

interface PredictionReport {
  prediction_id: string;
  predicted_disease: string;
  confidence_score: number;
  prediction_model?: string;
  differential?: Array<{ disease: string; confidence: number }>;
  triggered_rules?: string[];
  severity?: {
    severity?: string;
    urgency_level?: string;
    emergency_flag?: boolean;
    explanation?: string;
  };
  specialist?: {
    specialist?: string;
    reason?: string;
  };
  symptoms_used?: string[];
  predicted_at?: string;
}

export default function PredictionResultPage({ params }: { params: { id: string } }) {
  const [report, setReport] = useState<PredictionReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api
      .get(`/predictions/${params.id}`)
      .then(({ data }) => {
        if (isMounted && data) {
          setReport(data);
        }
      })
      .catch((err) => {
        console.warn("[Predictions] Report query error:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
        <Spinner size="lg" color="primary" />
        <span className="text-xs text-slate-400">Loading diagnostic prediction report...</span>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] max-w-md mx-auto text-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-teal-500/10 text-[#0D9488] flex items-center justify-center mb-4">
          <Activity className="w-8 h-8" />
        </div>
        <h2 className="font-heading text-xl font-bold text-slate-900 dark:text-white">
          Report Not Found
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          No diagnostic prediction was found matching report ID #{params.id}. Please start a symptom check to generate a new report.
        </p>
        <div className="flex items-center gap-3 mt-6">
          <Link
            href="/history"
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
          >
            Back to History
          </Link>
          <Link
            href="/symptom-chat"
            className="px-4 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold shadow-md transition-colors"
          >
            Start Symptom Assessment
          </Link>
        </div>
      </div>
    );
  }

  const confidencePct = Math.round((report.confidence_score || 0) * 100);
  const isEmergency = Boolean(report.severity?.emergency_flag);
  const formattedDate = report.predicted_at
    ? new Date(report.predicted_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recently Generated";

  const severityNorm = (report.severity?.urgency_level || report.severity?.severity || "Routine").toLowerCase();

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/history"
              className="inline-flex items-center text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 gap-1 mr-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>History</span>
            </Link>
            <span className="px-2.5 py-0.5 rounded-md bg-[#0D9488]/10 text-[#0D9488] dark:text-[#14B8A6] font-mono text-[11px] font-bold">
              REPORT #{report.prediction_id || params.id}
            </span>
            <span className="text-xs text-slate-400">{formattedDate}</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Clinical Prediction & Diagnostic Report
          </h1>
        </div>

        <Link
          href="/hospitals"
          className="px-5 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 w-fit"
        >
          <Building2 className="w-4 h-4" />
          <span>Find Nearby Specialists</span>
        </Link>
      </div>

      {/* Emergency Red Flashing Banner (if emergency) */}
      {isEmergency && (
        <div className="p-5 rounded-2xl bg-rose-500/10 border-2 border-rose-500/50 text-rose-700 dark:text-rose-300 animate-emergency-pulse flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-rose-600 shrink-0" />
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-rose-600 dark:text-rose-400">
                CRITICAL EMERGENCY FLAG ACTIVATED
              </h3>
              <p className="text-xs">
                {report.severity?.explanation || "Immediate medical assessment required. Proceed directly to nearest emergency department."}
              </p>
            </div>
          </div>
          <a href="tel:108" className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-md shrink-0">
            Call 108
          </a>
        </div>
      )}

      {/* SECTION 1 — Primary Prediction */}
      <div className="card-clinical p-6 sm:p-8 bg-gradient-to-br from-white via-slate-50 to-teal-500/5 dark:from-slate-900 dark:to-slate-950 flex flex-col md:flex-row items-center justify-between gap-8 border-2 border-teal-500/20">
        <div className="flex flex-col gap-3 max-w-xl text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="px-3 py-1 rounded-full bg-[#0D9488]/10 text-[#0D9488] dark:text-[#14B8A6] text-xs font-bold uppercase tracking-wider">
              Primary Prediction
            </span>
            <span className="text-xs text-slate-400">{report.prediction_model || "Rule-Based Clinical Engine"}</span>
          </div>

          <h2 className="font-heading text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
            {report.predicted_disease}
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {report.severity?.explanation || "Clinical evaluation based on patient symptoms and medical knowledge rules."}
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2">
            <span className="px-3 py-1 rounded-full bg-teal-500/10 text-[#0D9488] dark:text-[#14B8A6] text-xs font-bold border border-teal-500/20">
              Urgency: {report.severity?.urgency_level || "Routine"}
            </span>
          </div>
        </div>

        {/* Confidence Score Gauge */}
        <div className="flex flex-col items-center justify-center shrink-0">
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-200 dark:text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-[#0D9488] stroke-current transition-all duration-1000 ease-out"
                strokeWidth="3.5"
                strokeDasharray={`${confidencePct}, 100`}
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="font-heading text-4xl font-extrabold text-slate-900 dark:text-white">
                {confidencePct}%
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Match Dial</span>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-500 mt-2">Clinical Confidence</span>
        </div>
      </div>

      {/* SECTION 2 — Severity Scale Assessment Bar */}
      <div className="card-clinical p-6 flex flex-col gap-6">
        <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#0D9488]" />
          <span>Severity Scale</span>
        </h3>

        {/* Horizontal 4-Segment Scale Bar */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Routine", color: "bg-emerald-500", key: "routine" },
            { label: "Non-Urgent", color: "bg-amber-500", key: "non-urgent" },
            { label: "Urgent", color: "bg-orange-500", key: "urgent" },
            { label: "Emergency", color: "bg-rose-500", key: "emergency" },
          ].map((seg, idx) => {
            const isActive = severityNorm.includes(seg.key);
            return (
              <div key={idx} className="flex flex-col gap-2">
                <div
                  className={`h-3 rounded-full transition-all ${
                    isActive ? `${seg.color} shadow-lg ring-4 ring-teal-500/20 scale-105` : "bg-slate-200 dark:bg-slate-800 opacity-60"
                  }`}
                />
                <span className={`text-center text-xs font-bold ${isActive ? "text-slate-900 dark:text-white" : "text-slate-400"}`}>
                  {seg.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Triggered Rules List */}
        {report.triggered_rules && report.triggered_rules.length > 0 && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Triggered Clinical Rules:</span>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
              {report.triggered_rules.map((rule, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0D9488]" /> {rule}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* SECTION 3 — Differential Diagnosis Table */}
      {report.differential && report.differential.length > 0 && (
        <div className="card-clinical p-6 flex flex-col gap-4">
          <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#0D9488]" />
            <span>Differential Diagnoses</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Condition</th>
                  <th className="py-3 px-4">Confidence Match</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {report.differential.map((d, i) => {
                  const confVal = Math.round(d.confidence > 1 ? d.confidence : d.confidence * 100);
                  const isTop = i === 0;
                  return (
                    <tr key={i} className={isTop ? "bg-teal-500/5 font-bold" : "hover:bg-slate-50 dark:hover:bg-slate-900/50"}>
                      <td className="py-3.5 px-4 text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        {isTop && <span className="w-2 h-2 rounded-full bg-[#0D9488]" />}
                        {d.disease}
                      </td>
                      <td className="py-3.5 px-4 w-48">
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${isTop ? "bg-[#0D9488]" : "bg-slate-400"}`} style={{ width: `${confVal}%` }} />
                          </div>
                          <span className="font-mono text-[11px]">{confVal}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 4 — Specialist Recommendation Card */}
      {report.specialist && (
        <div className="card-clinical p-6 bg-gradient-to-r from-teal-500/10 via-slate-50 to-slate-50 dark:from-teal-950/30 dark:to-slate-900 flex flex-col sm:flex-row items-center justify-between gap-6 border-2 border-teal-500/20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#0D9488] text-white flex items-center justify-center shrink-0 shadow-lg shadow-teal-500/30">
              <Stethoscope className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0D9488] dark:text-[#14B8A6]">
                Recommended Specialist
              </span>
              <h4 className="font-heading text-xl font-bold text-slate-900 dark:text-white">
                {report.specialist.specialist || "General Physician"}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {report.specialist.reason || "Evaluation with a specialist is advised for definitive diagnosis."}
              </p>
            </div>
          </div>

          <Link
            href="/hospitals"
            className="px-6 py-3 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs shadow-md transition-all shrink-0 flex items-center gap-2"
          >
            <span>Find Nearby Hospitals</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* SECTION 5 — Extracted Symptoms Chips */}
      {report.symptoms_used && report.symptoms_used.length > 0 && (
        <div className="card-clinical p-6 flex flex-col gap-3">
          <h3 className="font-heading text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#0D9488]" />
            <span>Extracted Clinical Symptoms</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {report.symptoms_used.map((sym, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-mono text-xs border border-slate-200 dark:border-slate-800"
              >
                #{sym.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
