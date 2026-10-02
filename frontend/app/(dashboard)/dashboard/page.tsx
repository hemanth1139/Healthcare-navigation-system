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
  ArrowRight,
  ExternalLink,
  Pill,
  Activity,
  AlertCircle,
  MapPin,
  Calendar,
  Zap,
  TrendingUp,
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/30 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-48 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-96 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/30 p-6 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-lg max-w-lg">
          <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Dashboard Synchronization Error</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-sm font-semibold shadow-md shadow-teal-500/30 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  const patient = data?.patientSummary;
  const metrics = data?.metrics || {
    totalConsultations: 0,
    totalSchemesChecked: 0,
    emergencyAlertsCount: 0,
    activeSchemesCount: 20,
  };
  const latest = data?.latestAssessment;
  const specialist = data?.specialistRecommendation;
  const recentConvs = data?.recentConsultations || [];
  const recentSchemes = data?.recentSchemeQueries || [];
  const hospitals = data?.recommendedHospitals || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Modern Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0D9488] via-[#0F766E] to-[#115E59] p-8 text-white shadow-xl shadow-teal-500/20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-teal-100 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                    <Calendar className="w-4 h-4" />
                    {todayDate}
                  </span>
                  {patient?.bloodGroup && (
                    <span className="px-4 py-2 rounded-full bg-white/10 text-sm font-bold text-teal-100">
                      {patient.bloodGroup}
                    </span>
                  )}
                  {patient?.age && (
                    <span className="px-4 py-2 rounded-full bg-white/10 text-sm font-bold text-teal-100">
                      {patient.age} years
                    </span>
                  )}
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  Welcome back, {patient?.fullName || user?.fullName || "Patient"}! 👋
                </h1>
                <p className="text-base text-teal-100/90 max-w-2xl">
                  Your centralized clinical navigation portal is active. Perform AI triage checks, verify government scheme eligibility, and discover specialized care.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/symptom-chat"
                  className="px-6 py-3 rounded-xl font-bold text-sm bg-white text-[#0D9488] hover:bg-teal-50 shadow-lg transition-all flex items-center gap-2 hover:scale-105"
                >
                  <Bot className="w-5 h-5" />
                  <span>Start Symptom Triage</span>
                </Link>
                <Link
                  href="/schemes"
                  className="px-6 py-3 rounded-xl font-semibold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm transition-all flex items-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  <span>Explore Schemes</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Consultations */}
          <Link href="/history" className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-teal-500/40 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-teal-500/30">
                <Stethoscope className="w-7 h-7" />
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Consultations</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{metrics.totalConsultations}</p>
            <p className="text-xs text-teal-600 dark:text-teal-400 font-medium mt-2">View full history</p>
          </Link>

          {/* Emergency Alerts */}
          <div className={`bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 shadow-sm ${
            metrics.emergencyAlertsCount > 0 
              ? "border-rose-500" 
              : "border-emerald-500"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                metrics.emergencyAlertsCount > 0 
                  ? "bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-rose-500/30" 
                  : "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald-500/30"
              }`}>
                <AlertTriangle className="w-7 h-7" />
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Emergency Alerts</p>
            <p className={`text-3xl font-bold mt-1 ${
              metrics.emergencyAlertsCount > 0 
                ? "text-rose-600 dark:text-rose-400" 
                : "text-emerald-600 dark:text-emerald-400"
            }`}>
              {metrics.emergencyAlertsCount}
            </p>
            <p className={`text-xs font-medium mt-2 ${
              metrics.emergencyAlertsCount > 0 
                ? "text-rose-600 font-bold" 
                : "text-emerald-600"
            }`}>
              {metrics.emergencyAlertsCount > 0 ? "Immediate attention" : "All clear"}
            </p>
          </div>

          {/* Government Schemes */}
          <Link href="/schemes" className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-teal-500/40 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/30">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Government Schemes</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{metrics.activeSchemesCount}</p>
            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-2">{metrics.totalSchemesChecked} checks performed</p>
          </Link>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Zap className="w-7 h-7" />
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Quick Actions</p>
            <div className="space-y-2 mt-3">
              <Link href="/hospitals" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400">
                Find Hospitals →
              </Link>
              <Link href="/specialists" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400">
                Find Specialists →
              </Link>
              <Link href="/profile" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400">
                Update Profile →
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Latest Assessment Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-950/30 px-6 py-4 border-b border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Latest Clinical Assessment</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">AI-powered symptom analysis</p>
                    </div>
                  </div>
                  {latest ? (
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${getSeverityBadgeClass(latest.severity)}`}>
                      {latest.urgencyLevel}
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-500/10 text-slate-500 border border-slate-500/20">
                      No Active Triage
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6">
                {latest ? (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Primary Suspected Diagnosis</span>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            {latest.predictedDisease}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {latest.explanation}
                          </p>
                        </div>
                        <div className="text-center md:text-right md:border-l md:border-slate-200 dark:md:border-slate-800 md:pl-6">
                          <span className="text-xs font-bold uppercase text-slate-400 block mb-1">AI Match Confidence</span>
                          <span className="text-4xl font-extrabold text-[#0D9488] dark:text-[#14B8A6]">
                            {Math.round(latest.confidenceScore * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-slate-400">
                        Assessed: {new Date(latest.assessedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <Link
                        href={`/predictions/${latest.conversationId}`}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#0D9488] to-[#0F766E] hover:from-[#0F766E] hover:to-[#115E59] text-white text-sm font-bold shadow-md shadow-teal-500/30 transition-all"
                      >
                        <span>View Full Report</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto">
                      <Stethoscope className="w-8 h-8 text-slate-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">No Symptom Assessments Completed</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
                        Describe your current symptoms in an AI consultation to receive real-time urgency classification and differential diagnoses.
                      </p>
                    </div>
                    <Link
                      href="/symptom-chat"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#0D9488] to-[#0F766E] hover:from-[#0F766E] hover:to-[#115E59] text-white text-sm font-bold shadow-md shadow-teal-500/30 transition-all"
                    >
                      <Bot className="w-5 h-5" />
                      <span>Begin Assessment</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Consultations */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-950/30 px-6 py-4 border-b border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Consultations</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Your consultation history</p>
                    </div>
                  </div>
                  <Link href="/history" className="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
                    <span>View All</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="p-6">
                {recentConvs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-500 dark:text-slate-400">No consultation history on record.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentConvs.map((c) => (
                      <div
                        key={c.conversationId}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-emerald-500/40 transition-all"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-slate-400 font-medium">{c.date} • {c.formattedTime}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getSeverityBadgeClass(c.severity)}`}>
                              {c.urgencyLevel}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 capitalize block">
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
                          className="px-4 py-2 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all"
                        >
                          View Report
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Government Scheme Inquiries */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-950/30 px-6 py-4 border-b border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Scheme Eligibility Checks</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Government healthcare schemes</p>
                    </div>
                  </div>
                  <Link href="/schemes" className="text-sm font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1">
                    <span>Explore Schemes</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="p-6">
                {recentSchemes.length === 0 ? (
                  <div className="text-center py-8 space-y-3">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No scheme eligibility inquiries performed yet. Check which state or central government healthcare benefits you qualify for.
                    </p>
                    <Link href="/schemes" className="inline-block text-sm font-bold text-purple-600 dark:text-purple-400 hover:underline">
                      Check Scheme Eligibility Now
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentSchemes.map((s) => (
                      <div
                        key={s.queryId}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex flex-col gap-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-white truncate flex-1">
                            {s.schemeName}
                          </span>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${getStatusBadgeClass(s.overallStatus)}`}>
                            {s.overallStatus.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                          {s.overallExplanation || s.userQuestion}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                          <span>Queried: {s.queriedAt}</span>
                          <Link href="/schemes" className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">
                            View Details
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Patient Profile Summary */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-950/30 px-6 py-4 border-b border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Patient Profile</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Baseline information</p>
                    </div>
                  </div>
                  <Link href="/profile" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">
                    Edit
                  </Link>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Gender & Age</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {patient?.gender || "Not set"}{patient?.age ? `, ${patient.age} yrs` : ""}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Blood Group</span>
                  <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                    {patient?.bloodGroup || "Not set"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Location</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {patient?.city || patient?.state ? `${patient.city || ""}, ${patient.state || ""}` : "Not set"}
                  </span>
                </div>

                {patient?.chronicConditions && patient.chronicConditions.length > 0 && (
                  <div className="pt-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Chronic Conditions
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {patient.chronicConditions.map((c, i) => (
                        <span key={i} className="px-3 py-1 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-medium border border-teal-500/20">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {patient?.medications && patient.medications.length > 0 && (
                  <div className="pt-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Active Medications
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {patient.medications.map((m, i) => (
                        <span key={i} className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 pb-6">
                <Link
                  href="/profile"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-semibold text-center transition-all shadow-md shadow-blue-500/30 block"
                >
                  View Complete Profile
                </Link>
              </div>
            </div>

            {/* Specialist Recommendation */}
            {specialist && (
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-950/30 rounded-3xl border-2 border-purple-500 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-purple-200 dark:border-purple-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block mb-1">
                    AI Specialist Recommendation
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <span>{specialist.specialist}</span>
                  </h3>
                </div>
                <div className="p-6">
                  {specialist.reason && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                      {specialist.reason}
                    </p>
                  )}
                  <Link
                    href="/hospitals"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-sm font-bold text-center transition-all shadow-md shadow-purple-500/30 block"
                  >
                    Find {specialist.specialist} Hospitals
                  </Link>
                </div>
              </div>
            )}

            {/* Nearby Hospitals */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-teal-50 to-teal-100 dark:from-teal-900/30 dark:to-teal-950/30 px-6 py-4 border-b border-teal-200 dark:border-teal-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Nearby Facilities</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Recommended hospitals</p>
                    </div>
                  </div>
                  <Link href="/hospitals" className="text-sm font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1">
                    <span>Map</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="p-6 space-y-3">
                {hospitals.map((h) => (
                  <div
                    key={h.hospitalId}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="flex-1">
                      <span className="text-sm font-bold text-slate-900 dark:text-white block line-clamp-1">
                        {h.hospitalName}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{h.city}</span>
                        {h.rating && (
                          <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {h.rating}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20 shrink-0 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> ER
                    </span>
                  </div>
                ))}
              </div>

              <div className="px-6 pb-6">
                <Link
                  href="/hospitals"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white text-sm font-semibold text-center transition-all shadow-md shadow-teal-500/30 block"
                >
                  Browse All Hospitals
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
