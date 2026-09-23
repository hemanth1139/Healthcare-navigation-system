"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Sparkles,
  Calendar,
  ArrowRight,
  Stethoscope,
  Building,
  FileText,
  Activity,
  AlertTriangle,
  Clock,
  Star,
  CheckCircle2,
  HeartPulse,
  ChevronRight,
  ShieldCheck,
  Bot,
} from "lucide-react";

import { hospitalApi } from "@/lib/mockHospitalData";
import { healthTipApi } from "@/lib/mockHealthTipData";
import { Hospital } from "@/types/hospital";
import { HealthTip } from "@/types/healthTip";

export default function DashboardHomePage() {
  const { user } = useAuth();
  const [nearbyHospitals, setNearbyHospitals] = React.useState<Hospital[]>([]);
  const [quickTips, setQuickTips] = React.useState<HealthTip[]>([]);
  const [loadingTips, setLoadingTips] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;
    Promise.all([
      hospitalApi.getHospitals().catch(() => []),
      healthTipApi.getTips().catch(() => []),
    ]).then(([hospitals, tips]) => {
      if (isMounted) {
        setNearbyHospitals((hospitals || []).slice(0, 3));
        setQuickTips((tips || []).slice(0, 2));
        setLoadingTips(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const recentConsultations: any[] = [];

  return (
    <div className="flex flex-col gap-8">
      {/* Row 1 — Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#042F2E] via-[#0D9488] to-[#115E59] p-6 sm:p-8 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-teal-400/20 blur-3xl animate-pulse" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-100 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full w-fit">
              <Calendar className="w-3.5 h-3.5 text-teal-300" />
              {todayDate}
            </span>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">
              Good morning, {user?.fullName || "Patient"}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed">
              Your clinical triage dashboard is active. Start a symptom assessment or explore eligible healthcare schemes anytime.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/symptom-chat"
              className="px-5 py-3 rounded-xl font-bold text-xs bg-white text-[#0D9488] hover:bg-teal-50 shadow-lg transition-all flex items-center gap-2 hover:scale-105"
            >
              <Bot className="w-4 h-4 text-[#0D9488]" />
              <span>Start Symptom Check</span>
            </Link>
            <Link
              href="/hospitals"
              className="px-4 py-3 rounded-xl font-semibold text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm transition-all flex items-center gap-1.5"
            >
              <Building className="w-4 h-4" />
              <span>Find Hospital</span>
            </Link>
            <Link
              href="/schemes"
              className="px-4 py-3 rounded-xl font-semibold text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm transition-all flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              <span>Check Scheme</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Row 2 — 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-clinical p-5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Consultations</span>
            <span className="font-heading text-2xl font-bold text-slate-900 dark:text-white mt-1">0</span>
            <span className="text-[11px] text-slate-400 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Ready for first check
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-[#0D9488] dark:text-[#14B8A6] flex items-center justify-center">
            <Stethoscope className="w-6 h-6" />
          </div>
        </div>

        <div className="card-clinical p-5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Last Assessment</span>
            <span className="font-heading text-lg font-bold text-slate-900 dark:text-white mt-1">None</span>
            <span className="text-[11px] text-slate-400 font-medium mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> No data
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-[#0D9488] dark:text-[#14B8A6] flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="card-clinical p-5 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Emergency Alerts</span>
            <span className="font-heading text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">0</span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">All clear</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="card-clinical p-5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Schemes</span>
            <span className="font-heading text-2xl font-bold text-slate-900 dark:text-white mt-1">0</span>
            <span className="text-[11px] text-slate-400 font-medium mt-1">Explore available schemes</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-[#0D9488] dark:text-[#14B8A6] flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Row 3 — 2 Column Layout (Recent Consultations + Latest Assessment Gauge) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Consultations */}
        <div className="lg:col-span-2 card-clinical p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#0D9488]" />
                <span>Recent Consultations</span>
              </h2>
              <Link href="/history" className="text-xs font-bold text-[#0D9488] dark:text-[#14B8A6] hover:underline flex items-center gap-1">
                <span>View History</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              {recentConsultations.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                  <Stethoscope className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">No consultations yet</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Start your first AI symptom assessment to receive triage guidance.</p>
                  </div>
                  <Link
                    href="/symptom-chat"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
                  >
                    <Bot className="w-4 h-4" />
                    Start Symptom Check
                  </Link>
                </div>
              ) : (
                recentConsultations.map((c) => (
                  <div key={c.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-teal-500/40 transition-colors">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-medium">{c.date}</span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${c.severityColor}`}>
                          {c.severity}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{c.symptom}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">Specialist: <strong className="text-slate-700 dark:text-slate-300">{c.specialist}</strong></span>
                    </div>

                    <Link href={`/predictions/${c.id}`} className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#0D9488] dark:text-[#14B8A6] bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 w-fit self-start sm:self-auto transition-colors">
                      View Report
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Latest Assessment Progress */}
        <div className="card-clinical p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#0D9488]" />
                <span>Latest Assessment</span>
              </h2>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                No Active Triage
              </span>
            </div>

            <div className="flex flex-col items-center justify-center my-6 text-center">
              <div className="w-16 h-16 rounded-full bg-teal-500/10 text-[#0D9488] flex items-center justify-center mb-3">
                <Stethoscope className="w-8 h-8" />
              </div>
              <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white">
                No Triage Results Yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                Complete a symptom check session to receive differential analysis, urgency classification, and specialist recommendations.
              </p>
            </div>
          </div>

          <Link href="/symptom-chat" className="w-full py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs text-center shadow-md transition-all">
            Start Symptom Assessment
          </Link>
        </div>
      </div>

      {/* Row 4 — 2 Column Layout (Nearby Hospitals + Quick Health Tips) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Nearby Hospitals Mini Cards */}
        <div className="card-clinical p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-[#0D9488]" />
                <span>Nearby Hospitals</span>
              </h2>
              <Link href="/hospitals" className="text-xs font-bold text-[#0D9488] dark:text-[#14B8A6] hover:underline flex items-center gap-1">
                <span>View Map</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              {nearbyHospitals.length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800">
                  <Building className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">No nearby hospitals loaded yet.</p>
                  <Link href="/hospitals" className="inline-block mt-2 text-xs font-semibold text-[#0D9488] hover:underline">
                    Browse Hospital Directory
                  </Link>
                </div>
              ) : (
                nearbyHospitals.map((h, i) => (
                  <div key={h.hospital_id || i} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{h.hospital_name}</span>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span>{h.city || "Nearby"}</span>
                        {h.rating && (
                          <span className="flex items-center gap-1 text-amber-500 font-semibold">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {h.rating}
                          </span>
                        )}
                      </div>
                    </div>

                    {h.has_emergency_room && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold border border-emerald-500/20 flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3 h-3" /> ER Open
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Health Tips */}
        <div className="card-clinical p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-[#0D9488]" />
                <span>Quick Health Tips</span>
              </h2>
              <Link href="/health-tips" className="text-xs font-bold text-[#0D9488] dark:text-[#14B8A6] hover:underline flex items-center gap-1">
                <span>All Tips</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              {quickTips.length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800">
                  <HeartPulse className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {loadingTips ? "Loading daily health tips..." : "No health tips available at the moment."}
                  </p>
                  <Link href="/health-tips" className="inline-block mt-2 text-xs font-semibold text-[#0D9488] hover:underline">
                    View Health Tips
                  </Link>
                </div>
              ) : (
                quickTips.map((tip, i) => (
                  <div key={tip.tip_id || i} className="p-4 rounded-2xl bg-gradient-to-r from-teal-500/5 to-slate-50 dark:from-teal-950/20 dark:to-slate-900 border border-teal-500/10 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-[#0D9488] dark:text-[#14B8A6] flex items-center justify-center shrink-0 mt-0.5">
                      <HeartPulse className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0D9488] dark:text-[#14B8A6]">{tip.category}</span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{tip.title}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{tip.summary}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

