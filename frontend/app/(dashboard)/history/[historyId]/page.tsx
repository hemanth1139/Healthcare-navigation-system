"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SeverityUrgencyCard } from "@/components/assessment/SeverityUrgencyCard";
import { ArrowLeft, Calendar, Stethoscope, FileText, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { SeverityUrgencyAssessment } from "@/types/assessment";
import { Spinner } from "@/components/ui/Spinner";

export default function HistoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const historyId = (params?.historyId as string) || "";

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
          const urgLevel = (data.severity?.urgency_level?.toUpperCase() || "ROUTINE") as any;
          const mapped: SeverityUrgencyAssessment = {
            assessment_id: data.severity?.assessment_id || `asmt_${data.prediction_id}`,
            consultation_id: historyId,
            urgency_level: urgLevel,
            urgency_label: urgLevel === "EMERGENCY" ? "Emergency" : urgLevel === "URGENT" ? "Urgent" : urgLevel === "NON_URGENT" ? "Non-Urgent" : "Routine",
            urgency_explanation: data.severity?.explanation || "Assessment completed via clinical rule engine.",
            recommended_action: data.severity?.explanation || "Clinical evaluation recommended.",
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
              ID: {historyId}
            </span>
            <h1 className="font-heading text-2xl font-bold text-[#0F172A] tracking-tight">
              Clinical Triage & Symptom Report
            </h1>
            <p className="text-xs text-[#64748B] flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5" />
              Recorded on Consultation Archive
            </p>
          </div>
        </div>
      </div>

      {/* Severity Urgency Triage Card or Empty State */}
      {assessment ? (
        <>
          <SeverityUrgencyCard assessment={assessment} />

          {/* Summary Notes */}
          <Card className="p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">
              <FileText className="w-4 h-4 text-teal-600" />
              <span>Consultation Summary & Notes</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {assessment.urgency_explanation}
            </p>
          </Card>
        </>
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
