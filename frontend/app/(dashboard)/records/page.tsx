"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Folder,
  FileText,
  Calendar,
  Sparkles,
  ShieldCheck,
  Search,
  Loader2,
  ExternalLink,
  Trash2,
  Activity,
  HeartPulse,
  Pill,
  AlertTriangle,
  Stethoscope,
  Building,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  ArrowRight,
  Plus,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";

interface PatientProfileData {
  full_name?: string;
  blood_group?: string;
  gender?: string;
  date_of_birth?: string;
  height_cm?: number;
  weight_kg?: number;
  allergies: Array<{ allergy_id: string; allergy_name: string; severity: string; notes?: string }>;
  conditions: Array<{ condition_id: string; condition_name: string; diagnosed_year?: number; notes?: string }>;
  medications: Array<{ medication_id: string; medicine_name: string; dosage: string; frequency: string; prescribed_by?: string }>;
}

interface DiagnosticRecord {
  id: string;
  name: string;
  category: string;
  date: string;
  url: string;
  fhir_resource?: string;
}

interface ConsultationRecord {
  id: string;
  conversationId: string;
  date: string;
  symptoms: string[];
  predictedDisease?: string;
  confidence?: number;
  severity?: string;
  urgency?: string;
  explanation?: string;
  specialist?: string;
  hospital?: string;
}

export default function MedicalRecordsPage() {
  const [profileData, setProfileData] = useState<PatientProfileData | null>(null);
  const [diagnosticRecords, setDiagnosticRecords] = useState<DiagnosticRecord[]>([]);
  const [consultations, setConsultations] = useState<ConsultationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "baseline" | "diagnostics" | "consultations">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch Patient Clinical Baseline Profile
      try {
        const [profRes, algRes, condRes, medRes] = await Promise.allSettled([
          api.get("/profile"),
          api.get("/profile/allergies"),
          api.get("/profile/conditions"),
          api.get("/profile/medications"),
        ]);

        const prof = profRes.status === "fulfilled" ? profRes.value.data : {};
        const algs = algRes.status === "fulfilled" && Array.isArray(algRes.value.data) ? algRes.value.data : [];
        const conds = condRes.status === "fulfilled" && Array.isArray(condRes.value.data) ? condRes.value.data : [];
        const meds = medRes.status === "fulfilled" && Array.isArray(medRes.value.data) ? medRes.value.data : [];

        setProfileData({
          full_name: prof.patient_name || prof.fullName,
          blood_group: prof.blood_group || prof.bloodGroup,
          gender: prof.gender,
          date_of_birth: prof.date_of_birth || prof.dateOfBirth,
          height_cm: prof.height_cm || prof.heightCm,
          weight_kg: prof.weight_kg || prof.weightKg,
          allergies: algs.map((a: any) => ({
            allergy_id: a.allergy_id || a.allergyId,
            allergy_name: a.allergy_name || a.allergyName,
            severity: a.severity || "Mild",
            notes: a.notes,
          })),
          conditions: conds.map((c: any) => ({
            condition_id: c.condition_id || c.conditionId,
            condition_name: c.condition_name || c.conditionName,
            diagnosed_year: c.diagnosed_year || c.diagnosedYear,
            notes: c.notes,
          })),
          medications: meds.map((m: any) => ({
            medication_id: m.medication_id || m.medicationId,
            medicine_name: m.medicine_name || m.medicineName,
            dosage: m.dosage,
            frequency: m.frequency,
            prescribed_by: m.prescribed_by || m.prescribedBy,
          })),
        });
      } catch (err) {
        console.warn("[Records] Error fetching profile baseline:", err);
      }

      // 2. Fetch Uploaded Diagnostic Records
      try {
        const docRes = await api.get("/records");
        const docs = docRes.data || [];
        const mappedDocs: DiagnosticRecord[] = docs.map((d: any) => ({
          id: d.recordId || d.record_id || d.id,
          name: d.recordName || d.record_name || d.file_name || "Diagnostic Report",
          category: d.recordType || d.category || "Lab Report",
          date: d.createdAt || d.created_at || d.upload_date
            ? new Date(d.createdAt || d.created_at || d.upload_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "Recent",
          url: d.originalFileUrl || d.cloudinary_url || "#",
          fhir_resource: d.anonymizedTextContent || d.fhir_resource,
        }));
        setDiagnosticRecords(mappedDocs);
      } catch (err) {
        console.warn("[Records] Error fetching documents:", err);
      }

      // 3. Fetch Clinical Consultations History
      try {
        const histRes = await api.get("/history");
        const hist = histRes.data || [];
        const mappedConsultations: ConsultationRecord[] = hist.map((h: any) => {
          const syms = Array.isArray(h.symptoms) ? h.symptoms : [];
          return {
            id: h.prediction_id || h.conversation_id || `hist_${Math.random()}`,
            conversationId: h.conversation_id || "",
            date: h.created_at
              ? new Date(h.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Recent",
            symptoms: syms,
            predictedDisease: h.predicted_disease || "Clinical Assessment",
            confidence: Math.round((h.confidence_score || 0.85) * 100),
            severity: h.severity || "MODERATE",
            urgency: h.urgency || "ROUTINE",
            explanation: h.explanation,
            specialist: h.recommended_specialist,
            hospital: h.recommended_hospital,
          };
        });
        setConsultations(mappedConsultations);
      } catch (err) {
        console.warn("[Records] Error fetching consultation history:", err);
      }
    } catch (err: any) {
      console.error("[Records] Failed to fetch medical records:", err);
      setError("Unable to load your medical records. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteDiagnostic = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(id);
      await api.delete(`/records/${id}`);
      setDiagnosticRecords((prev) => prev.filter((r) => r.id !== id));
      showToast("Diagnostic record deleted successfully.");
    } catch (err) {
      console.error("[Records] Failed to delete record:", err);
      showToast("Failed to delete record. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredDiagnostics = diagnosticRecords.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredConsultations = consultations.filter(
    (c) =>
      (c.predictedDisease || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.symptoms.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.specialist || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasAnyRecords =
    (profileData && (profileData.allergies.length > 0 || profileData.conditions.length > 0 || profileData.medications.length > 0)) ||
    diagnosticRecords.length > 0 ||
    consultations.length > 0;

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-16">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0D9488] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <ShieldCheck className="w-4 h-4" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Folder className="w-7 h-7 text-[#0D9488]" />
            <span>Comprehensive Medical Records</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Unified access to clinical baseline profile, diagnostic lab reports, and AI consultation history.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors"
            title="Refresh records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#0D9488]" : ""}`} />
          </button>
          <Link
            href="/documents"
            className="px-4 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Document</span>
          </Link>
        </div>
      </div>

      {/* Search & Tabs Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-x-auto">
          {[
            { id: "all", label: "All Records" },
            { id: "baseline", label: "Clinical Baseline" },
            { id: "diagnostics", label: `Diagnostics (${diagnosticRecords.length})` },
            { id: "consultations", label: `Consultations (${consultations.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-white dark:bg-slate-900 text-[#0D9488] shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search symptoms, diagnosis, file..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-[#0D9488]"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 gap-3 min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#0D9488]" />
          <span className="text-xs text-slate-500">Loading comprehensive medical records...</span>
        </div>
      ) : error ? (
        <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Failed to Load Records</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-[#0D9488] text-white text-xs font-semibold rounded-xl"
          >
            Retry
          </button>
        </div>
      ) : !hasAnyRecords ? (
        /* Empty State */
        <div className="p-16 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/10 text-[#0D9488] flex items-center justify-center mx-auto">
            <Folder className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No Medical Records Available Yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Your patient medical repository is currently empty. Complete your profile, upload past diagnostic files, or initiate an AI symptom consultation to automatically build your records.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/symptom-chat"
              className="px-4 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold text-xs transition-all shadow-sm"
            >
              Start Symptom Chat
            </Link>
            <Link
              href="/profile"
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-xs transition-all"
            >
              Update Profile Baseline
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* SECTION 1: PATIENT CLINICAL BASELINE INFORMATION */}
          {(activeTab === "all" || activeTab === "baseline") && profileData && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-[#0D9488] flex items-center justify-center">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-heading text-base font-bold text-slate-900 dark:text-slate-100">
                      Patient Clinical Baseline
                    </h2>
                    <p className="text-xs text-slate-500">
                      Demographics, biological markers, allergies, and active medications
                    </p>
                  </div>
                </div>
                <Link
                  href="/profile"
                  className="text-xs font-semibold text-[#0D9488] hover:underline flex items-center gap-1"
                >
                  Edit Profile
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Baseline Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Blood Group</span>
                  <p className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                    {profileData.blood_group || "Not recorded"}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gender / DOB</span>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {profileData.gender || "—"} {profileData.date_of_birth ? `(${profileData.date_of_birth})` : ""}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Height / Weight</span>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {profileData.height_cm ? `${profileData.height_cm} cm` : "—"} /{" "}
                    {profileData.weight_kg ? `${profileData.weight_kg} kg` : "—"}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Regimen</span>
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {profileData.medications.length} Prescriptions
                  </p>
                </div>
              </div>

              {/* Detailed Lists: Allergies, Conditions, Medications */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* Allergies */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    Allergies ({profileData.allergies.length})
                  </span>
                  {profileData.allergies.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No known allergies</p>
                  ) : (
                    <div className="space-y-1.5">
                      {profileData.allergies.map((a) => (
                        <div key={a.allergy_id} className="text-xs bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{a.allergy_name}</span>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            {a.severity}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Chronic Conditions */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-500" />
                    Chronic Conditions ({profileData.conditions.length})
                  </span>
                  {profileData.conditions.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No chronic conditions recorded</p>
                  ) : (
                    <div className="space-y-1.5">
                      {profileData.conditions.map((c) => (
                        <div key={c.condition_id} className="text-xs bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{c.condition_name}</span>
                          {c.diagnosed_year && (
                            <span className="text-[10px] text-slate-400 font-mono">Since {c.diagnosed_year}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Active Medications */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-emerald-500" />
                    Medications ({profileData.medications.length})
                  </span>
                  {profileData.medications.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No active medications</p>
                  ) : (
                    <div className="space-y-1.5">
                      {profileData.medications.map((m) => (
                        <div key={m.medication_id} className="text-xs bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{m.medicine_name}</p>
                            <p className="text-[10px] text-slate-400">{m.dosage} • {m.frequency}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: DIAGNOSTIC & UPLOADED DOCUMENTS */}
          {(activeTab === "all" || activeTab === "diagnostics") && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <span>Diagnostic Lab Reports & Prescriptions ({filteredDiagnostics.length})</span>
                </h2>
              </div>

              {filteredDiagnostics.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-slate-500">No diagnostic reports matching filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredDiagnostics.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{doc.name}</h3>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {doc.category}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                              PII Scrubbed
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" />
                            Uploaded on {doc.date}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Link
                          href={`/records/${doc.id}`}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View FHIR Metadata
                        </Link>
                        {doc.url && doc.url !== "#" && (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/50 transition-colors"
                            title="Open original file"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteDiagnostic(doc.id, doc.name)}
                          disabled={deletingId === doc.id}
                          className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                          title="Delete record"
                        >
                          {deletingId === doc.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 3: CONSULTATION & TRIAGE RECORDS */}
          {(activeTab === "all" || activeTab === "consultations") && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#0D9488]" />
                  <span>Clinical Consultations & Triage Assessments ({filteredConsultations.length})</span>
                </h2>
              </div>

              {filteredConsultations.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-slate-500">No consultation assessments found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredConsultations.map((c) => (
                    <div
                      key={c.id}
                      className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-[#0D9488] flex items-center justify-center font-bold text-xs">
                            <Activity className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-xs text-slate-400 font-semibold">{c.date} • AI Triage</span>
                            <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white capitalize">
                              {c.predictedDisease}
                            </h3>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              c.severity?.toUpperCase() === "HIGH" || c.severity?.toUpperCase() === "CRITICAL"
                                ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                                : c.severity?.toUpperCase() === "MODERATE"
                                ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                            }`}
                          >
                            {c.severity || "MODERATE"} Severity
                          </span>
                          {c.confidence && (
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-semibold">
                              {c.confidence}% Match
                            </span>
                          )}
                          <button
                            onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            {expandedId === c.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      {/* Symptoms Chips */}
                      {c.symptoms.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className="text-[11px] font-bold text-slate-400 mr-1">Reported Symptoms:</span>
                          {c.symptoms.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Expandable Explanation & Specialist/Hospital Referrals */}
                      {expandedId === c.id && (
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in">
                          {c.explanation && (
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                Clinical Assessment Rationale
                              </span>
                              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                {c.explanation}
                              </p>
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            {c.specialist && (
                              <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
                                <Stethoscope className="w-4 h-4 text-[#0D9488]" />
                                <div>
                                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                                    Specialist Referral
                                  </span>
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    {c.specialist}
                                  </span>
                                </div>
                              </div>
                            )}
                            {c.hospital && (
                              <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
                                <Building className="w-4 h-4 text-[#0D9488]" />
                                <div>
                                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                                    Recommended Facility
                                  </span>
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    {c.hospital}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {c.conversationId && (
                            <div className="pt-2 flex justify-end">
                              <Link
                                href={`/chat/${c.conversationId}`}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D9488] hover:underline"
                              >
                                <span>Revisit Full Conversation Transcript</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
