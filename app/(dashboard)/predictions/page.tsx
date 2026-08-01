"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FullPredictionReport } from "@/types/prediction";
import { predictionApi } from "@/lib/mockPredictionData";
import { SeverityBadge } from "@/components/predictions/SeverityBadge";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Activity, ArrowRight, Calendar, Sparkles } from "lucide-react";

export default function PredictionsHistoryPage() {
  const [reports, setReports] = useState<FullPredictionReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const data = await predictionApi.getAllReports();
        setReports(data);
      } catch (err) {
        console.error("Failed to load prediction history", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[300px]">
        <Spinner size="lg" color="primary" />
        <span className="text-xs text-[#5C6B6E] mt-2">Loading clinical triage history...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="border-b border-[#E6F4F3] pb-4">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#1E2A2E]">
          Predictions & Triage History
        </h1>
        <p className="text-xs sm:text-sm text-[#5C6B6E]">
          Access historical symptom check assessments, differential diagnosis scores, and SHAP explanations
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {reports.map((report) => {
          const { prediction, severityAssessment } = report;
          const formattedDate = new Date(prediction.predicted_at).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          });

          return (
            <Link
              key={prediction.prediction_id}
              href={`/predictions/${prediction.prediction_id}`}
              className="block group focus-ring rounded-2xl"
            >
              <Card
                interactive
                className={`p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  severityAssessment.emergency_flag ? "border-2 border-[#E5573F]/40 bg-[#FDF0EE]/40" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                      severityAssessment.emergency_flag
                        ? "bg-[#E5573F] text-white"
                        : "bg-[#E6F4F3] text-[#0F6E7A]"
                    }`}
                  >
                    <Activity className="w-6 h-6" />
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2.5">
                      <SeverityBadge
                        severity={severityAssessment.severity}
                        urgencyText={severityAssessment.urgency_level}
                      />
                      <span className="text-xs text-[#5C6B6E] font-mono flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#0F6E7A]" /> {formattedDate}
                      </span>
                    </div>

                    <h2 className="font-heading font-bold text-base text-[#1E2A2E] group-hover:text-[#0F6E7A] transition-colors mt-0.5">
                      {prediction.predicted_disease}
                    </h2>

                    <p className="text-xs text-[#5C6B6E] line-clamp-1">
                      Top Match Confidence:{" "}
                      <strong className="text-[#0F6E7A] font-mono">
                        {Math.round(prediction.confidence_score * 100)}%
                      </strong>{" "}
                      • Model: {prediction.prediction_model}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-[#0F6E7A] group-hover:translate-x-1 transition-transform self-end sm:self-center">
                  <span>View Full Report</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
