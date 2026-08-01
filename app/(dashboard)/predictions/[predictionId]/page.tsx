"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FullPredictionReport } from "@/types/prediction";
import { predictionApi, MOCK_EMERGENCY_PREDICTION } from "@/lib/mockPredictionData";
import { SeverityBadge } from "@/components/predictions/SeverityBadge";
import { PredictionDisclaimer } from "@/components/predictions/PredictionDisclaimer";
import { PredictionSummaryCard } from "@/components/predictions/PredictionSummaryCard";
import { DiseaseConfidenceList } from "@/components/predictions/DiseaseConfidenceList";
import { ShapExplanationChart } from "@/components/predictions/ShapExplanationChart";
import { NextStepsPanel } from "@/components/predictions/NextStepsPanel";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, ArrowLeft, PhoneCall, Building2, ShieldAlert } from "lucide-react";

export default function PredictionResultPage() {
  const params = useParams();
  const predictionId = (params?.predictionId as string) || "pred_101";

  const [report, setReport] = useState<FullPredictionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoEmergencyMode, setDemoEmergencyMode] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        if (demoEmergencyMode) {
          setReport(MOCK_EMERGENCY_PREDICTION);
        } else {
          const data = await predictionApi.getReport(predictionId);
          setReport(data);
        }
      } catch (err) {
        console.error("Failed to load prediction report", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [predictionId, demoEmergencyMode]);

  if (loading || !report) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <Spinner size="lg" color="primary" />
        <span className="text-xs text-[#5C6B6E] mt-2">
          Generating clinical differential report & SHAP attributions...
        </span>
      </div>
    );
  }

  const { prediction, differential, shapExplanations, severityAssessment } = report;
  const isEmergency = severityAssessment.emergency_flag;

  return (
    <div className="flex flex-col gap-6 sm:gap-8 max-w-6xl mx-auto">
      {/* Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E6F4F3] pb-4">
        <div className="flex flex-col gap-1">
          <Link
            href="/predictions"
            className="inline-flex items-center text-xs font-semibold text-[#0F6E7A] hover:underline focus-ring rounded p-1 -ml-1 gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Triage History
          </Link>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#1E2A2E] tracking-tight">
            Clinical Triage & Prediction Report
          </h1>
        </div>

        {/* Demo State Switcher for Evaluator */}
        <div className="flex items-center gap-2 bg-[#E6F4F3]/60 p-1.5 rounded-xl border border-[#0F6E7A]/20 self-start sm:self-auto">
          <span className="text-[11px] font-semibold text-[#0F6E7A] px-2">Demo State:</span>
          <button
            onClick={() => setDemoEmergencyMode(false)}
            type="button"
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              !demoEmergencyMode
                ? "bg-white text-[#0F6E7A] shadow-2xs font-bold"
                : "text-[#5C6B6E] hover:text-[#1E2A2E]"
            }`}
          >
            Normal (Moderate)
          </button>
          <button
            onClick={() => setDemoEmergencyMode(true)}
            type="button"
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              demoEmergencyMode
                ? "bg-[#E5573F] text-white shadow-2xs font-bold"
                : "text-[#5C6B6E] hover:text-[#E5573F]"
            }`}
          >
            Emergency Alert
          </button>
        </div>
      </div>

      {/* a. Severity Banner / Emergency State (TOP SAFETY CRITICAL INFO) */}
      {isEmergency ? (
        <div
          role="alert"
          aria-live="assertive"
          className="bg-[#FDF0EE] border-2 border-[#E5573F] rounded-2xl p-6 shadow-clinical-lg flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#E5573F] text-white flex items-center justify-center shrink-0 shadow-sm">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <SeverityBadge
                  severity="emergency"
                  urgencyText="Critical Emergency Alert"
                />
              </div>

              <h2 className="font-heading font-bold text-xl text-[#1E2A2E] mt-1">
                Immediate Hospital Evaluation Recommended
              </h2>

              <p className="text-xs sm:text-sm text-[#1E2A2E] leading-relaxed">
                {severityAssessment.explanation}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-[#E5573F]/25">
            <a href="tel:108" className="w-full sm:w-auto">
              <Button variant="urgent" size="lg" fullWidth>
                <PhoneCall className="w-5 h-5 mr-2 animate-bounce" />
                <span>Call 108 Emergency Services</span>
              </Button>
            </a>

            <Link href="/hospitals" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" fullWidth className="border-[#E5573F]/40 text-[#E5573F]">
                <Building2 className="w-5 h-5 mr-2" />
                <span>Find Emergency Room Facilities</span>
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-[#E6F4F3] shadow-xs">
          <div className="flex items-center gap-3">
            <SeverityBadge
              severity={severityAssessment.severity}
              urgencyText={severityAssessment.urgency_level}
            />
            <p className="text-xs text-[#5C6B6E] hidden sm:inline">
              {severityAssessment.explanation}
            </p>
          </div>
        </div>
      )}

      {/* b. Permanent Non-Dismissible Medical Disclaimer */}
      <PredictionDisclaimer />

      {/* c. Report Metadata Summary Card */}
      <PredictionSummaryCard prediction={prediction} />

      {/* d & e. Differential Diagnosis & SHAP Attributions (2-Column Desktop Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
        {/* Left: Ranked Differential Diagnosis */}
        <DiseaseConfidenceList differential={differential} />

        {/* Right: SHAP Feature Attribution Chart */}
        <ShapExplanationChart explanations={shapExplanations} />
      </div>

      {/* f. Contextual Actionable Next Steps */}
      <NextStepsPanel
        severity={severityAssessment.severity}
        specialistCategory={report.recommendedSpecialistCategory}
      />
    </div>
  );
}
