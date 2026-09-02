"use client";

import React, { useState } from "react";
import { MultiDocEligibilityResult, EligibilityCriterion, EligibilityStatus, CriterionResult } from "@/types/scheme";
import { Card } from "@/components/ui/Card";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  ExternalLink,
  AlertTriangle,
  Info,
  BookOpen,
} from "lucide-react";

interface MultiDocEligibilityCardProps {
  result: MultiDocEligibilityResult;
}

const OVERALL_STATUS_CONFIG: Record<
  EligibilityStatus,
  { bg: string; border: string; text: string; badge: string; icon: React.ReactNode; label: string }
> = {
  ELIGIBLE: {
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    text: "text-emerald-800",
    badge: "bg-emerald-600 text-white",
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
    label: "ELIGIBLE",
  },
  NOT_ELIGIBLE: {
    bg: "bg-red-50",
    border: "border-red-300",
    text: "text-red-800",
    badge: "bg-red-600 text-white",
    icon: <XCircle className="w-5 h-5 text-red-600" />,
    label: "NOT ELIGIBLE",
  },
  POSSIBLY_ELIGIBLE: {
    bg: "bg-amber-50",
    border: "border-amber-300",
    text: "text-amber-800",
    badge: "bg-amber-500 text-white",
    icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
    label: "POSSIBLY ELIGIBLE",
  },
  INSUFFICIENT_INFORMATION: {
    bg: "bg-slate-50",
    border: "border-slate-300",
    text: "text-slate-700",
    badge: "bg-slate-600 text-white",
    icon: <HelpCircle className="w-5 h-5 text-slate-500" />,
    label: "INSUFFICIENT INFORMATION",
  },
};

const CRITERION_CONFIG: Record<
  CriterionResult,
  { icon: React.ReactNode; text: string; bg: string; border: string }
> = {
  PASS: {
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  FAIL: {
    icon: <XCircle className="w-4 h-4 text-red-600" />,
    text: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
  },
  UNKNOWN: {
    icon: <HelpCircle className="w-4 h-4 text-slate-400" />,
    text: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
  },
};

const CriterionRow: React.FC<{ criterion: EligibilityCriterion }> = ({ criterion }) => {
  const [expanded, setExpanded] = useState(false);
  const cfg = CRITERION_CONFIG[criterion.criterion_result];

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left"
      >
        <div className="flex items-center gap-2">
          {cfg.icon}
          <span className={`text-xs font-semibold ${cfg.text}`}>
            {criterion.criterion_name}
          </span>
          {criterion.is_missing_info && (
            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
              Missing Info
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${cfg.border} ${cfg.text}`}
          >
            {criterion.criterion_result}
          </span>
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 flex flex-col gap-2 border-t border-white/60">
          {/* Values comparison */}
          {(criterion.patient_value || criterion.required_value) && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {criterion.patient_value && (
                <div className="bg-white/80 rounded-lg p-2">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Your Value</p>
                  <p className="text-[11px] font-semibold text-slate-800 mt-0.5">
                    {criterion.patient_value}
                  </p>
                </div>
              )}
              {criterion.required_value && (
                <div className="bg-white/80 rounded-lg p-2">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Required</p>
                  <p className="text-[11px] font-semibold text-slate-800 mt-0.5">
                    {criterion.required_value}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Explanation */}
          <p className="text-[11px] text-slate-600 leading-relaxed">{criterion.explanation}</p>

          {/* Evidence Sources */}
          {criterion.supporting_evidence.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                Evidence Sources
              </p>
              {criterion.supporting_evidence.map((src) => (
                <div
                  key={src.chunk_id}
                  className="bg-white/70 border border-slate-200 rounded-lg p-2.5"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1">
                      <FileText className="w-3 h-3 text-blue-500 shrink-0" />
                      <span className="text-[10px] font-semibold text-blue-700 line-clamp-1">
                        {src.document_title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {src.page_number && (
                        <span className="text-[10px] text-slate-400">p.{src.page_number}</span>
                      )}
                      <a
                        href={src.official_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-600 italic leading-relaxed line-clamp-3">
                    &ldquo;{src.excerpt}&rdquo;
                  </p>
                  {src.relevance_score !== undefined && (
                    <div className="mt-1.5 flex items-center gap-1">
                      <div className="h-1 flex-1 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-400 rounded-full"
                          style={{ width: `${Math.round(src.relevance_score * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {Math.round(src.relevance_score * 100)}% match
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const MultiDocEligibilityCard: React.FC<MultiDocEligibilityCardProps> = ({ result }) => {
  const cfg = OVERALL_STATUS_CONFIG[result.overall_status];
  const passCount = result.criteria_breakdown.filter((c) => c.criterion_result === "PASS").length;
  const failCount = result.criteria_breakdown.filter((c) => c.criterion_result === "FAIL").length;
  const unknownCount = result.criteria_breakdown.filter(
    (c) => c.criterion_result === "UNKNOWN"
  ).length;

  return (
    <Card className={`border-2 ${cfg.border} ${cfg.bg} p-5 flex flex-col gap-4`}>
      {/* Overall Status Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/80 border-2 border-white flex items-center justify-center">
            {cfg.icon}
          </div>
          <div>
            <span className={`inline-block text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mb-0.5 ${cfg.badge}`}>
              {cfg.label}
            </span>
            <p className="text-[11px] text-slate-500">
              Based on {result.all_evidence_sources.length} document chunk(s) retrieved
            </p>
          </div>
        </div>

        {/* Criteria summary pills */}
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
          {passCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
              {passCount} PASS
            </span>
          )}
          {failCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
              {failCount} FAIL
            </span>
          )}
          {unknownCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {unknownCount} UNKNOWN
            </span>
          )}
        </div>
      </div>

      {/* Overall Explanation */}
      <p className={`text-xs leading-relaxed ${cfg.text}`}>{result.overall_explanation}</p>

      {/* Missing Information Alert */}
      {result.missing_information && result.missing_information.length > 0 && (
        <div className="bg-white/80 border border-amber-200 rounded-xl p-3 flex flex-col gap-1.5">
          <p className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 uppercase">
            <Info className="w-3.5 h-3.5" />
            Missing Information Required
          </p>
          <ul className="flex flex-col gap-1">
            {result.missing_information.map((item, idx) => (
              <li key={idx} className="text-[11px] text-amber-800 flex items-start gap-1.5">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Criteria Breakdown */}
      {result.criteria_breakdown.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Criterion-Level Breakdown
          </p>
          {result.criteria_breakdown.map((criterion) => (
            <CriterionRow key={criterion.criterion_id} criterion={criterion} />
          ))}
        </div>
      )}
    </Card>
  );
};
