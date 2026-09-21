"use client";

import React, { useState } from "react";
import { MultiDocEligibilityResult, EligibilityCriterion, EligibilityStatus, CriterionResult, EvidenceSource } from "@/types/scheme";
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
  if (!criterion) return null;
  const [expanded, setExpanded] = useState(false);
  const criterionResult = (criterion.criterion_result || (criterion as any).criterionResult || "UNKNOWN") as CriterionResult;
  const cfg = CRITERION_CONFIG[criterionResult] || CRITERION_CONFIG.UNKNOWN;
  const criterionName = criterion.criterion_name || (criterion as any).criterionName || "Criterion";
  const patientValue = criterion.patient_value || (criterion as any).patientValue;
  const requiredValue = criterion.required_value || (criterion as any).requiredValue;
  const isMissingInfo = criterion.is_missing_info || (criterion as any).isMissingInfo;
  const rawEvidence = criterion.supporting_evidence || (criterion as any).supportingEvidence || [];
  const supportingEvidence: EvidenceSource[] = Array.isArray(rawEvidence) ? rawEvidence : [];

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left"
      >
        <div className="flex items-center gap-2">
          {cfg.icon}
          <span className={`text-xs font-semibold ${cfg.text}`}>
            {criterionName}
          </span>
          {isMissingInfo && (
            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
              Missing Info
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${cfg.border} ${cfg.text}`}
          >
            {criterionResult}
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
          {(patientValue || requiredValue) && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {patientValue && (
                <div className="bg-white/80 rounded-lg p-2">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Your Value</p>
                  <p className="text-[11px] font-semibold text-slate-800 mt-0.5">
                    {patientValue}
                  </p>
                </div>
              )}
              {requiredValue && (
                <div className="bg-white/80 rounded-lg p-2">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Required</p>
                  <p className="text-[11px] font-semibold text-slate-800 mt-0.5">
                    {requiredValue}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Explanation */}
          <p className="text-[11px] text-slate-600 leading-relaxed">{criterion.explanation}</p>

          {/* Evidence Sources */}
          {supportingEvidence.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                Evidence Sources
              </p>
              {supportingEvidence.map((src, idx) => {
                const docTitle = src.document_title || (src as any).documentTitle || "Scheme Document";
                const pageNum = src.page_number || (src as any).pageNumber;
                const officialUrl = src.official_url || (src as any).officialUrl || "https://pmjay.gov.in";
                const relScore = src.relevance_score || (src as any).relevanceScore;
                const chunkId = src.chunk_id || (src as any).chunkId || `chk_${idx}`;

                return (
                  <div
                    key={chunkId}
                    className="bg-white/70 border border-slate-200 rounded-lg p-2.5"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3 text-blue-500 shrink-0" />
                        <span className="text-[10px] font-semibold text-blue-700 line-clamp-1">
                          {docTitle}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {pageNum && (
                          <span className="text-[10px] text-slate-400">p.{pageNum}</span>
                        )}
                        <a
                          href={officialUrl}
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
                    {relScore !== undefined && (
                      <div className="mt-1.5 flex items-center gap-1">
                        <div className="h-1 flex-1 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-400 rounded-full"
                            style={{ width: `${Math.round(relScore * 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {Math.round(relScore * 100)}% match
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const MultiDocEligibilityCard: React.FC<MultiDocEligibilityCardProps> = ({ result }) => {
  if (!result) return null;

  const status = (result.overall_status || (result as any).overallStatus || "INSUFFICIENT_INFORMATION") as EligibilityStatus;
  const cfg = OVERALL_STATUS_CONFIG[status] || OVERALL_STATUS_CONFIG.INSUFFICIENT_INFORMATION;

  const rawCriteria = result.criteria_breakdown || (result as any).criteriaBreakdown || [];
  const criteriaBreakdown: EligibilityCriterion[] = Array.isArray(rawCriteria) ? rawCriteria : [];

  const rawEvidence = result.all_evidence_sources || (result as any).allEvidenceSources || [];
  const evidenceSources: EvidenceSource[] = Array.isArray(rawEvidence) ? rawEvidence : [];

  const rawMissing = result.missing_information || (result as any).missingInformation || [];
  const missingInformation: string[] = Array.isArray(rawMissing) ? rawMissing : [];

  const passCount = criteriaBreakdown.filter(
    (c) => (c?.criterion_result || (c as any)?.criterionResult) === "PASS"
  ).length;
  const failCount = criteriaBreakdown.filter(
    (c) => (c?.criterion_result || (c as any)?.criterionResult) === "FAIL"
  ).length;
  const unknownCount = criteriaBreakdown.filter(
    (c) => (c?.criterion_result || (c as any)?.criterionResult) === "UNKNOWN"
  ).length;

  const explanationText = result.overall_explanation || (result as any).overallExplanation || "";

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
              Based on {evidenceSources.length} document chunk(s) retrieved
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
      <p className={`text-xs leading-relaxed ${cfg.text}`}>{explanationText}</p>

      {/* Missing Information Alert */}
      {missingInformation.length > 0 && (
        <div className="bg-white/80 border border-amber-200 rounded-xl p-3 flex flex-col gap-1.5">
          <p className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 uppercase">
            <Info className="w-3.5 h-3.5" />
            Missing Information Required
          </p>
          <ul className="flex flex-col gap-1">
            {missingInformation.map((item, idx) => (
              <li key={idx} className="text-[11px] text-amber-800 flex items-start gap-1.5">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Criteria Breakdown */}
      {criteriaBreakdown.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Criterion-Level Breakdown
          </p>
          {criteriaBreakdown.map((criterion, idx) => (
            <CriterionRow
              key={criterion?.criterion_id || (criterion as any)?.criterionId || `cr_${idx}`}
              criterion={criterion}
            />
          ))}
        </div>
      )}
    </Card>
  );
};
