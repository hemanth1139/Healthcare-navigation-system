"use client";

import React from "react";
import { StructuredSymptomPayload } from "@/types/symptom";
import { Card } from "@/components/ui/Card";
import {
  CheckCircle2,
  Clock,
  Zap,
  AlertCircle,
  Activity,
  ThumbsUp,
} from "lucide-react";

interface StructuredSymptomCardProps {
  symptom: StructuredSymptomPayload;
  onViewAssessment?: () => void;
}

const SEVERITY_CONFIG = {
  mild: {
    label: "Mild",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  moderate: {
    label: "Moderate",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  severe: {
    label: "Severe",
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
    dot: "bg-orange-500",
  },
  critical: {
    label: "Critical",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-500",
  },
};

export const StructuredSymptomCard: React.FC<StructuredSymptomCardProps> = ({
  symptom,
  onViewAssessment,
}) => {
  const cfg = SEVERITY_CONFIG[symptom.severity_indicator];
  const presentAssociated = symptom.associated_symptoms.filter((s) => s.present);

  return (
    <Card className="border-2 border-teal-100 bg-gradient-to-br from-teal-50/60 to-white p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-teal-600">
              Symptom Intake Complete
            </p>
            <h3 className="font-heading font-bold text-sm text-slate-900 mt-0.5">
              Structured Symptom Summary
            </h3>
          </div>
        </div>

        {/* Severity Badge */}
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.border} ${cfg.color}`}
        >
          <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>

      {/* Primary Symptom */}
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Primary Symptom
        </p>
        <p className="text-sm font-semibold text-slate-900">{symptom.primary_symptom}</p>
      </div>

      {/* Meta Row: Duration & Onset */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-2.5">
          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Duration</p>
            <p className="text-xs font-semibold text-slate-800">{symptom.duration}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-2.5">
          <Zap className="w-4 h-4 text-slate-400 shrink-0" />
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Onset</p>
            <p className="text-xs font-semibold text-slate-800">{symptom.onset}</p>
          </div>
        </div>
      </div>

      {/* Associated Symptoms */}
      {presentAssociated.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Associated Symptoms
          </p>
          <div className="flex flex-wrap gap-1.5">
            {presentAssociated.map((s) => (
              <span
                key={s.name}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-teal-50 border border-teal-200 text-[11px] font-medium text-teal-700"
              >
                <AlertCircle className="w-3 h-3" />
                {s.name}
                {s.duration && (
                  <span className="text-teal-400 font-normal">• {s.duration}</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Risk Factors */}
      {symptom.risk_factors.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Risk Factors
          </p>
          <div className="flex flex-col gap-1">
            {symptom.risk_factors.map((rf) => (
              <div
                key={rf.factor}
                className="flex items-center justify-between text-xs bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5"
              >
                <span className="font-medium text-amber-800">{rf.factor}</span>
                <span className="text-amber-600">{rf.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Severity Score */}
      {symptom.severity_score !== undefined && (
        <div className="flex items-center gap-3">
          <Activity className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Severity Score
              </span>
              <span className="text-xs font-bold text-slate-900">{symptom.severity_score}/10</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  symptom.severity_score <= 3
                    ? "bg-emerald-500"
                    : symptom.severity_score <= 6
                    ? "bg-amber-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${(symptom.severity_score / 10) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      {onViewAssessment && (
        <button
          onClick={onViewAssessment}
          className="mt-1 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400"
        >
          <ThumbsUp className="w-4 h-4" />
          View Severity & Urgency Assessment
        </button>
      )}
    </Card>
  );
};
