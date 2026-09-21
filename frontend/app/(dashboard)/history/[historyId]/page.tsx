"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MOCK_ASSESSMENTS } from "@/lib/mockAssessmentData";
import { SeverityUrgencyCard } from "@/components/assessment/SeverityUrgencyCard";
import { ArrowLeft, Calendar, Stethoscope, FileText } from "lucide-react";

export default function HistoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const historyId = (params?.historyId as string) || "cons_001";

  // Pick first mock assessment as sample detail
  const assessment = MOCK_ASSESSMENTS[0];

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto py-4">
      {/* Back Button */}
      <div>
        <Button
          variant="outline"
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

      {/* Severity Urgency Triage Card */}
      <SeverityUrgencyCard assessment={assessment} />

      {/* Summary Notes */}
      <Card className="p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2 font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">
          <FileText className="w-4 h-4 text-teal-600" />
          <span>Consultation Summary & Notes</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          The patient presented with acute symptom clusters evaluated using standard clinical red-flag logic. Emergency referral and specialist consultation were recommended accordingly.
        </p>
      </Card>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2">
        <Link href="/history">
          <Button variant="outline" size="sm">
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
