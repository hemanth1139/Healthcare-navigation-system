"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { DashboardResponse } from "@/types/dashboard";
import {
  Stethoscope,
  Building,
  FileText,
  AlertTriangle,
  Clock,
  Star,
  CheckCircle2,
  HeartPulse,
  ChevronRight,
  ShieldCheck,
  Bot,
  User as UserIcon,
  RefreshCw,
  FolderOpen,
  ArrowRight,
  ExternalLink,
  Pill,
  Activity,
  AlertCircle,
} from "lucide-react";

export default function DashboardHomePage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<DashboardResponse>("/dashboard");
      setData(res.data);
    } catch (err: any) {
      console.error("[Dashboard] Error fetching unified dashboard data:", err);
      setError("Unable to load live dashboard metrics. Please check your connection and retry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const getSeverityBadgeClass = (severity?: string) => {
    const s = (severity || "").toLowerCase();
    if (s === "emergency" || s === "high") {
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    }
    if (s === "moderate") {
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    }
    return "bg-teal-500/10 text-[#0D9488] dark:text-[#14B8A6] border-teal-500/20";
  };

  const getStatusBadgeClass = (status?: string) => {
    const st = (status || "").toUpperCase();
    if (st === "ELIGIBLE") return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    if (st === "POSSIBLY_ELIGIBLE") return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    if (st === "NOT_ELIGIBLE") return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse pb-12">
        {/* Banner Skeleton */}
        <div className="h-48 rounded-3xl bg-slate-200 dark:bg-slate-800" />
        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
        {/* Core Layout Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-96 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8 my-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm max-w-lg mx-auto space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Dashboard Synchronization Error</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{error}</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  const patient = data?.patientSummary;
  const metrics = data?.metrics || {
    totalConsultations: 0,
    totalRecords: 0,
    totalSchemesChecked: 0,
    emergencyAlertsCount: 0,
    activeSchemesCount: 40,
  };
  const latest = data?.latestAssessment;
  const specialist = data?.specialistRecommendation;
  const recentConvs = data?.recentConsultations || [];
  const recentSchemes = data?.recentSchemeQueries || [];
  const hospitals = data?.recommendedHospitals || [];

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* 1. Welcome & Patient Overview Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#042F2E] via-[#0D9488] to-[#115E59] p-6 sm:p-8 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-teal-400/20 blur-3xl animate-pulse" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-100 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full w-fit">
                <Clock className="w-3.5 h-3.5 text-teal-300" />
                {todayDate}
              </span>
              {patient?.bloodGroup && (
                <span className="text-[11px] font-bold text-teal-200 bg-white/10 px-2.5 py-0.5 rounded-full">
                  Blood Group: {patient.bloodGroup}
                </span>
              )}
              {patient?.age && (
                <span className="text-[11px] font-bold text-teal-200 bg-white/10 px-2.5 py-0.5 rounded-full">
                  Age: {patient.age} yrs
                </span>
              )}
            </div>

            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {patient?.fullName || user?.fullName || "Patient"}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed">
              Your centralized clinical navigation portal is active. Perform AI triage checks, verify government scheme eligibility, and discover specialized care.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/symptom-chat"
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-white text-[#0D9488] hover:bg-teal-50 shadow-lg transition-all flex items-center gap-2 hover:scale-[1.02]"
            >
              <Bot className="w-4 h-4 text-[#0D9488]" />
              <span>Start Symptom Triage</span>
            </Link>
            <Link
              href="/documents"
              className="px-4 py-2.5 rounded-xl font-semibold text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm transition-all flex items-center gap-1.5"
            >
              <FolderOpen className="w-4 h-4" />
              <span>Upload Records</span>
            </Link>
            <Link
              href="/schemes"
              className="px-4 py-2.5 rounded-xl font-semibold text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm transition-all flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              <span>Explore Schemes</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Unified Metric Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Consultations */}
        <Link href="/history" className="card-clinical p-5 flex items-center justify-between hover:border-teal-500/40 transition-colors group">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Consultations</span>
            <span className="font-heading text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {metrics.totalConsultations}
            </span>
            <span className="text-[11px] text-[#0D9488] dark:text-[#14B8A6] font-medium mt-1 flex items-center gap-1">
              <span>View full history</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-[#0D9488] dark:text-[#14B8A6] flex items-center justify-center">
            <Stethoscope className="w-6 h-6" />
          </div>
        </Link>

        {/* Verified Medical Records */}
        <Link href="/records" className="card-clinical p-5 flex items-center justify-between hover:border-teal-500/40 transition-colors group">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Verified Medical Records</span>
            <span className="font-heading text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {metrics.totalRecords}
            </span>
            <span className="text-[11px] text-slate-400 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Encrypted & PII Scrubbed
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <FolderOpen className="w-6 h-6" />
          </div>
        </Link>

        {/* Active Emergency Alerts */}
        <div className={`card-clinical p-5 flex items-center justify-between border-l-4 ${
          metrics.emergencyAlertsCount > 0 ? "border-l-rose-500 bg-rose-50/30 dark:bg-rose-950/10" : "border-l-emerald-500"
        }`}>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Emergency & High Alerts</span>
            <span className={`font-heading text-2xl font-bold mt-1 ${
              metrics.emergencyAlertsCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
            }`}>
              {metrics.emergencyAlertsCount}
            </span>
            <span className={`text-[11px] font-medium mt-1 ${
              metrics.emergencyAlertsCount > 0 ? "text-rose-600 font-bold" : "text-emerald-600"
            }`}>
              {metrics.emergencyAlertsCount > 0 ? "Immediate ER / Urgent Attention" : "All triage status normal"}
            </span>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            metrics.emergencyAlertsCount > 0 ? "bg-rose-500/10 text-rose-600" : "bg-emerald-500/10 text-emerald-600"
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Active Government Schemes */}
        <Link href="/schemes" className="card-clinical p-5 flex items-center justify-between hover:border-teal-500/40 transition-colors group">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Government Schemes</span>
            <span className="font-heading text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {metrics.activeSchemesCount}
            </span>
            <span className="text-[11px] text-[#0D9488] dark:text-[#14B8A6] font-medium mt-1 flex items-center gap-1">
              <span>{metrics.totalSchemesChecked} checks performed</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-[#0D9488] dark:text-[#14B8A6] flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </Link>
      </div>

      {/* 3. Core 2-Column Clinical Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols wide) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Latest Clinical Assessment Card */}
          <div className="card-clinical p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#0D9488]" />
                  <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                    Latest Clinical Assessment
                  </h2>
                </div>
                {latest ? (
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${getSeverityBadgeClass(latest.severity)}`}>
                    {latest.urgencyLevel}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-500 border border-slate-500/20">
                    No Active Triage
                  </span>
                )}
              </div>

              {latest ? (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Primary Suspected Diagnosis</span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {latest.predictedDisease}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        {latest.explanation}
                      </p>
                    </div>
                    <div className="text-right sm:border-l sm:border-slate-200 dark:sm:border-slate-800 sm:pl-4 shrink-0">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">AI Match Confidence</span>
                      <span className="font-mono text-xl font-extrabold text-[#0D9488] dark:text-[#14B8A6]">
                        {Math.round(latest.confidenceScore * 100)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-400">
                      Assessed: {new Date(latest.assessedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <Link
                      href={`/predictions/${latest.conversationId}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#0D9488] hover:bg-[#0F766E] px-4 py-2 rounded-xl shadow-sm transition-colors"
                    >
                      <span>View Full Diagnosis Report</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                  <Stethoscope className="w-10 h-10 text-slate-400 mx-auto" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Symptom Assessments Completed</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                      Describe your current symptoms in an AI consultation to receive real-time urgency classification and differential diagnoses.
                    </p>
                  </div>
                  <Link
                    href="/symptom-chat"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold shadow-sm transition-colors"
                  >
                    <Bot className="w-4 h-4" />
                    <span>Begin Symptom Assessment</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Consultations List */}
          <div className="card-clinical p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#0D9488]" />
                  <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                    Recent Consultations
                  </h2>
                </div>
                <Link href="/history" className="text-xs font-bold text-[#0D9488] dark:text-[#14B8A6] hover:underline flex items-center gap-1">
                  <span>View All</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {recentConvs.length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400">No consultation history on record.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {recentConvs.map((c) => (
                    <div
                      key={c.conversationId}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-teal-500/40 transition-colors"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-medium">{c.date} • {c.formattedTime}</span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${getSeverityBadgeClass(c.severity)}`}>
                            {c.urgencyLevel}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100 capitalize">
                          {c.primarySymptom}
                        </span>
                        {c.predictedDisease && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Condition: <strong className="text-slate-700 dark:text-slate-300">{c.predictedDisease}</strong>
                          </span>
                        )}
                      </div>

                      <Link
                        href={`/predictions/${c.conversationId}`}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#0D9488] dark:text-[#14B8A6] bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 w-fit self-start sm:self-auto transition-colors"
                      >
                        View Report
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Government Scheme Inquiries Widget */}
          <div className="card-clinical p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#0D9488]" />
                  <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                    Government Healthcare Scheme Eligibility
                  </h2>
                </div>
                <Link href="/schemes" className="text-xs font-bold text-[#0D9488] dark:text-[#14B8A6] hover:underline flex items-center gap-1">
                  <span>Explore Schemes</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {recentSchemes.length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No scheme eligibility inquiries performed yet. Check which state or central government healthcare benefits you qualify for.
                  </p>
                  <Link href="/schemes" className="inline-block text-xs font-bold text-[#0D9488] hover:underline">
                    Check Scheme Eligibility Now
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {recentSchemes.map((s) => (
                    <div
                      key={s.queryId}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {s.schemeName}
                        </span>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border shrink-0 ${getStatusBadgeClass(s.overallStatus)}`}>
                          {s.overallStatus.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        {s.overallExplanation || s.userQuestion}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span>Queried: {s.queriedAt}</span>
                        <Link href="/schemes" className="text-[#0D9488] dark:text-[#14B8A6] font-semibold hover:underline">
                          View Details &bull; Guidelines
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col wide) */}
        <div className="flex flex-col gap-6">
          {/* Patient Baseline Profile Summary */}
          <div className="card-clinical p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-[#0D9488]" />
                  <h2 className="font-heading text-base font-bold text-slate-900 dark:text-white">
                    Patient Profile Baseline
                  </h2>
                </div>
                <Link href="/profile/edit" className="text-xs font-bold text-[#0D9488] dark:text-[#14B8A6] hover:underline">
                  Edit
                </Link>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-400">Gender & Age:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {patient?.gender || "Not set"}{patient?.age ? `, ${patient.age} yrs` : ""}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-400">Blood Group:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {patient?.bloodGroup || "Not set"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-400">Location:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {patient?.city || patient?.state ? `${patient.city || ""}, ${patient.state || ""}` : "Not set"}
                  </span>
                </div>

                {patient?.chronicConditions && patient.chronicConditions.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Chronic Conditions
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {patient.chronicConditions.map((c, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-teal-500/10 text-[#0D9488] dark:text-[#14B8A6] text-[10px] font-medium border border-teal-500/20">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {patient?.medications && patient.medications.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Active Medications
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {patient.medications.map((m, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-medium">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Link
              href="/profile"
              className="mt-4 w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold text-center transition-colors block"
            >
              View Complete Clinical Profile
            </Link>
          </div>

          {/* Specialist Recommendation Card */}
          {specialist && (
            <div className="card-clinical p-6 flex flex-col justify-between border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50/20 to-white dark:from-purple-950/10 dark:to-slate-900">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block mb-1">
                  AI Specialist Recommendation
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span>{specialist.specialist}</span>
                </h3>
                {specialist.reason && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                    {specialist.reason}
                  </p>
                )}
              </div>
              <Link
                href="/hospitals"
                className="mt-4 inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-colors"
              >
                <span>Find {specialist.specialist} Hospitals</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Nearby / Recommended Hospitals Mini-Widget */}
          <div className="card-clinical p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-[#0D9488]" />
                  <h2 className="font-heading text-base font-bold text-slate-900 dark:text-white">
                    Nearby Facilities
                  </h2>
                </div>
                <Link href="/hospitals" className="text-xs font-bold text-[#0D9488] dark:text-[#14B8A6] hover:underline flex items-center gap-1">
                  <span>Map</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="flex flex-col gap-3">
                {hospitals.map((h) => (
                  <div
                    key={h.hospitalId}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                        {h.hospitalName}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>{h.city}</span>
                        {h.rating && (
                          <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {h.rating}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold border border-emerald-500/20 shrink-0 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> ER
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/hospitals"
              className="mt-4 w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold text-center transition-colors block"
            >
              Browse Complete Hospital Directory
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
