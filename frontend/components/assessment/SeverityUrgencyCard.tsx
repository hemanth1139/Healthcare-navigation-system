"use client";

import React, { useState } from "react";
import { SeverityUrgencyAssessment, SpecialistRecommendation, UrgencyLevel } from "@/types/assessment";
import { Card } from "@/components/ui/Card";
import {
  Siren,
  AlertTriangle,
  Clock,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Stethoscope,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";

interface SeverityUrgencyCardProps {
  assessment: SeverityUrgencyAssessment;
  specialist?: SpecialistRecommendation | null;
  compact?: boolean;
}

const URGENCY_CONFIG: Record<
  UrgencyLevel,
  { icon: React.ReactNode; bg: string; border: string; badge: string; text: string; label: string }
> = {
  EMERGENCY: {
    icon: <Siren className="w-5 h-5 text-red-600" />,
    bg: "bg-red-50",
    border: "border-red-400",
    badge: "bg-red-600 text-white",
    text: "text-red-800",
    label: "EMERGENCY",
  },
  URGENT: {
    icon: <AlertTriangle className="w-5 h-5 text-orange-600" />,
    bg: "bg-orange-50",
    border: "border-orange-400",
    badge: "bg-orange-500 text-white",
    text: "text-orange-800",
    label: "URGENT",
  },
  NON_URGENT: {
    icon: <Clock className="w-5 h-5 text-amber-600" />,
    bg: "bg-amber-50",
    border: "border-amber-400",
    badge: "bg-amber-500 text-white",
    text: "text-amber-800",
    label: "NON-URGENT",
  },
  ROUTINE: {
    icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
    bg: "bg-emerald-50",
    border: "border-emerald-400",
    badge: "bg-emerald-600 text-white",
    text: "text-emerald-800",
    label: "ROUTINE",
  },
};

export const SeverityUrgencyCard: React.FC<SeverityUrgencyCardProps> = ({
  assessment,
  specialist,
  compact = false,
}) => {
  const [showRedFlags, setShowRedFlags] = useState(false);
  const cfg = URGENCY_CONFIG[assessment.urgency_level];
  const hasRedFlags = assessment.triggered_red_flags.length > 0;

  return (
    <Card
      className={`border-2 ${cfg.border} ${cfg.bg} p-5 flex flex-col gap-4`}
    >
      {/* Header: Urgency Badge + Label */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 ${cfg.border} bg-white`}>
            {cfg.icon}
          </div>
          <div>
            <span className={`inline-block text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${cfg.badge} mb-0.5`}>
              {cfg.label}
            </span>
            <h3 className={`font-heading font-bold text-sm ${cfg.text}`}>
              {assessment.urgency_label}
            </h3>
          </div>
        </div>
        <ShieldAlert className={`w-5 h-5 ${cfg.text} opacity-50`} />
      </div>

      {/* Explanation */}
      <div className={`text-xs leading-relaxed ${cfg.text}`}>
        {assessment.urgency_explanation}
      </div>

      {/* Recommended Action */}
      <div className="bg-white/80 border border-white rounded-xl p-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
          Recommended Action
        </p>
        <p className="text-xs font-semibold text-slate-900">{assessment.recommended_action}</p>
      </div>

      {/* Triggered Red Flags */}
      {hasRedFlags && (
        <div>
          <button
            onClick={() => setShowRedFlags(!showRedFlags)}
            className={`flex items-center justify-between w-full text-xs font-bold ${cfg.text} py-1`}
          >
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Clinical Red Flags Triggered ({assessment.triggered_red_flags.length})
            </span>
            {showRedFlags ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showRedFlags && (
            <div className="mt-2 flex flex-col gap-2">
              {assessment.triggered_red_flags.map((flag) => (
                <div
                  key={flag.rule_id}
                  className="bg-white/90 border border-red-100 rounded-lg p-3"
                >
                  <p className="text-xs font-bold text-red-700 mb-0.5">{flag.rule_name}</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {flag.description}
                  </p>
                  {flag.literature_reference && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <BookOpen className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="text-[10px] italic text-slate-400">
                        {flag.literature_reference}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Specialist Recommendation (if provided) */}
      {!compact && specialist && (
        <div className="border-t border-white/80 pt-4 flex flex-col gap-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Recommended Specialist
          </p>
          <div className="flex items-center justify-between gap-3 bg-white/80 rounded-xl p-3 border border-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">
                  {specialist.specialist_category}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                  {specialist.recommendation_reason}
                </p>
              </div>
            </div>
            <Link
              href="/hospitals"
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline shrink-0"
            >
              Find Hospital
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </Card>
  );
};
