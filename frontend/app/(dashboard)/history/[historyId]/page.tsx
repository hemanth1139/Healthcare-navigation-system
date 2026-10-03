"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SeverityUrgencyCard } from "@/components/assessment/SeverityUrgencyCard";
import {
  ArrowLeft,
  Calendar,
  Stethoscope,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldCheck,
  Building2,
  Info,
  MessageSquareQuote,
} from "lucide-react";
import { api } from "@/lib/api";
import { SeverityUrgencyAssessment } from "@/types/assessment";
import { Spinner } from "@/components/ui/Spinner";

export default function HistoryDetailPage({ params }: { params: Promise<{ historyId: string }> }) {
  const { historyId } = use(params);
  const router = useRouter();

  const [predictionData, setPredictionData] = useState<any>(null);
  const [assessment, setAssessment] = useState<SeverityUrgencyAssessment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (!historyId) {
      setLoading(false);
      return;
    }

    api
      .get(`/predictions/${historyId}`)
      .then(({ data }) => {
        if (!isMounted) return;
        if (data) {
          setPredictionData(data);
          const urgLevel = (data.severity?.urgency_level?.toUpperCase() || "ROUTINE") as any;
          const mapped: SeverityUrgencyAssessment = {
            assessment_id: data.severity?.assessment_id || `asmt_${data.prediction_id}`,
            consultation_id: historyId,
            urgency_level: urgLevel,
            urgency_label:
              urgLevel === "EMERGENCY"
                ? "Emergency Medical Assessment"
                : urgLevel === "URGENT"
                ? "Urgent Medical Evaluation"
                : urgLevel === "NON_URGENT"
                ? "Non-Urgent Clinical Care"
                : "Routine Primary Care",
            urgency_explanation: data.severity?.explanation || "Assessment evaluated via clinical safety rules.",
            recommended_action: data.recommended_action || data.severity?.explanation || "Clinical evaluation recommended.",
            triggered_red_flags: (data.triggered_rules || []).map((r: string, idx: number) => ({
              rule_id: `rf_${idx}`,
              rule_name: r,
              description: r,
            })),
            assessed_at: data.predicted_at || new Date().toISOString(),
          };
          setAssessment(mapped);
        }
      })
      .catch((err) => {
        console.warn("[HistoryDetail] Query failed:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [historyId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-3">
        <Spinner size="lg" color="primary" />
        <span className="text-xs text-slate-400">Loading consultation record...</span>
      </div>
    );
  }

  const specCategory = predictionData?.specialist?.specialist || "General Physician";
  const specReason = predictionData?.specialist?.reason || "";

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto py-4">
      {/* Back Button */}
      <div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to History</span>
        </Button>
      </div>

      {/* Header */}
      <div className="border-b border-[#F0FDFA] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              Record ID: {historyId}
            </span>
            <h1 className="font-heading text-2xl font-bold text-[#0F172A] tracking-tight">
              Clinical Triage & Symptom Report
            </h1>
            <p className="text-xs text-[#64748B] flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5" />
              {predictionData?.predicted_at
                ? new Date(predictionData.predicted_at).toLocaleString()
                : "Recorded on Consultation Archive"}
            </p>
          </div>
        </div>
      </div>

      {assessment && predictionData ? (
        <div className="flex flex-col gap-5">
          {/* 1. Verbatim Original Complaint Banner */}
          {predictionData.original_complaint && (
            <Card className="p-4 bg-slate-50 border-slate-200 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <MessageSquareQuote className="w-4 h-4 text-teal-600" />
                <span>Patient's Original Stated Complaint</span>
              </div>
              <p className="text-sm italic font-medium text-slate-900 bg-white p-2.5 rounded-lg border border-slate-200">
                "{predictionData.original_complaint}"
              </p>
            </Card>
          )}

          {/* 2. Urgency & Triage Card */}
          <SeverityUrgencyCard
            assessment={assessment}
            specialist={{
              recommendation_id: `rec_${historyId}`,
              assessment_id: assessment.assessment_id,
              specialist_category: specCategory,
              specialist_description: specCategory,
              recommendation_reason: specReason,
              urgency_level: assessment.urgency_level,
              fallback_to_gp: specCategory === "General Physician",
            }}
          />

          {/* 3. Primary & Associated Clinical Findings Grid */}
          <Card className="p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Symptom Taxonomy & Findings Breakdown</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Primary Complaint */}
              <div className="bg-teal-50/50 border border-teal-100 rounded-xl p-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                  Primary Classified Symptom
                </span>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {predictionData.primary_symptom || "General Assessment"}
                </p>
                {predictionData.associated_symptoms?.length > 0 && (
                  <div className="mt-2.5">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">
                      Associated Symptoms:
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {predictionData.associated_symptoms.map((s: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-teal-100/70 text-[11px] font-medium text-teal-800"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Recommended Specialist Box */}
              <div className="bg-sky-50/50 border border-sky-100 rounded-xl p-3.5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">
                    Recommended Specialist
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-sky-600" />
                    {specCategory}
                  </p>
                  {specReason && (
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      {specReason}
                    </p>
                  )}
                </div>
                <div className="mt-3 pt-2 border-t border-sky-100 flex justify-end">
                  <Link
                    href={`/hospitals?specialty=${encodeURIComponent(specCategory)}`}
                    className="text-xs font-semibold text-sky-700 hover:underline flex items-center gap-1"
                  >
                    Search {specCategory} Hospitals &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* Findings Lists (Positive, Negative, Unknown) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {/* Positive Findings */}
              <div className="border border-emerald-100 bg-emerald-50/40 rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Positive Findings</span>
                </div>
                {predictionData.positive_findings?.length > 0 ? (
                  <ul className="space-y-1">
                    {predictionData.positive_findings.map((f: string, i: number) => (
                      <li key={i} className="text-xs text-emerald-950 font-medium">
                        • {f}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400 italic">None reported</p>
                )}
              </div>

              {/* Negative Findings */}
              <div className="border border-slate-200 bg-slate-50/60 rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                  <XCircle className="w-3.5 h-3.5 text-slate-500" />
                  <span>Negative Findings</span>
                </div>
                {predictionData.negative_findings?.length > 0 ? (
                  <ul className="space-y-1">
                    {predictionData.negative_findings.map((f: string, i: number) => (
                      <li key={i} className="text-xs text-slate-700">
                        • {f}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400 italic">None documented</p>
                )}
              </div>

              {/* Unknown / Unscreened Findings */}
              <div className="border border-amber-100 bg-amber-50/40 rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-2">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Unknown / Not Evaluated</span>
                </div>
                {predictionData.unknown_findings?.length > 0 ? (
                  <ul className="space-y-1">
                    {predictionData.unknown_findings.map((f: string, i: number) => (
                      <li key={i} className="text-xs text-amber-900">
                        • {f}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400 italic">No remaining unknowns</p>
                )}
              </div>
            </div>
          </Card>

          {/* 4. Limitations & Safety Disclaimer */}
          <Card className="p-4 bg-amber-50/30 border-amber-200 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <Info className="w-4 h-4 text-amber-600" />
              <span>Clinical Triage Rationale & System Limitations</span>
            </div>
            {predictionData.limitations?.length > 0 && (
              <ul className="space-y-1 text-xs text-slate-700">
                {predictionData.limitations.map((lim: string, idx: number) => (
                  <li key={idx}>• {lim}</li>
                ))}
              </ul>
            )}
            <p className="text-[11px] text-slate-500 italic mt-1">
              {predictionData.disclaimer ||
                "DISCLAIMER: This automated triage tool evaluates urgency based on reported symptoms and safety rules. It does not provide definitive medical diagnoses or replace clinical examination."}
            </p>
          </Card>
        </div>
      ) : (
        <Card className="p-8 text-center flex flex-col items-center justify-center gap-3">
          <AlertCircle className="w-10 h-10 text-slate-300" />
          <h3 className="font-heading font-bold text-base text-slate-800 dark:text-slate-200">
            Assessment Record Not Found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm">
            No assessment details could be retrieved for consultation #{historyId}.
          </p>
        </Card>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2">
        <Link href="/history">
          <Button variant="secondary" size="sm">
            View All History
          </Button>
        </Link>
        <Link href="/symptom-chat">
          <Button variant="primary" size="sm">
            Start New Triage
          </Button>
        </Link>
      </div>
    </div>
  );
}

