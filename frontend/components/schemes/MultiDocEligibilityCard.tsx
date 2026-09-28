"use client";

import React, { useState } from "react";
import {
  MultiDocEligibilityResult,
  EligibilityCriterion,
  EligibilityStatus,
  CriterionResult,
  EvidenceSource,
  MissingCriterionItem,
} from "@/types/scheme";
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
  ClipboardCheck,
  ArrowRight,
  Loader2,
  MapPin,
  Calendar,
  IndianRupee,
} from "lucide-react";

interface MultiDocEligibilityCardProps {
  result: MultiDocEligibilityResult;
  /** Called when user submits answers in the interactive interview. Pass this from the parent page. */
  onContinue?: (queryId: string, additionalInfo: Record<string, any>) => Promise<void>;
}

const OVERALL_STATUS_CONFIG: Record<
  EligibilityStatus,
  { bg: string; border: string; text: string; badge: string; icon: React.ReactNode; label: string }
> = {
  ELIGIBLE: {
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-emerald-300 dark:border-emerald-800",
    text: "text-emerald-800 dark:text-emerald-300",
    badge: "bg-emerald-600 text-white",
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
    label: "ELIGIBLE",
  },
  NOT_ELIGIBLE: {
    bg: "bg-red-50 dark:bg-red-950/20",
    border: "border-red-300 dark:border-red-800",
    text: "text-red-800 dark:text-red-300",
    badge: "bg-red-600 text-white",
    icon: <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />,
    label: "NOT ELIGIBLE",
  },
  POSSIBLY_ELIGIBLE: {
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-300 dark:border-amber-800",
    text: "text-amber-800 dark:text-amber-300",
    badge: "bg-amber-500 text-white",
    icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
    label: "POSSIBLY ELIGIBLE",
  },
  INSUFFICIENT_INFORMATION: {
    bg: "bg-slate-50 dark:bg-slate-900/40",
    border: "border-slate-300 dark:border-slate-700",
    text: "text-slate-700 dark:text-slate-300",
    badge: "bg-slate-600 text-white",
    icon: <HelpCircle className="w-5 h-5 text-slate-500 dark:text-slate-400" />,
    label: "INSUFFICIENT INFORMATION",
  },
  PROFILE_DATA_REQUIRED: {
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-300 dark:border-blue-800",
    text: "text-blue-800 dark:text-blue-300",
    badge: "bg-blue-600 text-white",
    icon: <ClipboardCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
    label: "PROFILE DETAILS NEEDED",
  },
  COVERED: {
    bg: "bg-teal-50 dark:bg-teal-950/20",
    border: "border-teal-300 dark:border-teal-800",
    text: "text-teal-800 dark:text-teal-300",
    badge: "bg-teal-600 text-white",
    icon: <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
    label: "COVERED PROCEDURE",
  },
  NOT_COVERED: {
    bg: "bg-rose-50 dark:bg-rose-950/20",
    border: "border-rose-300 dark:border-rose-800",
    text: "text-rose-800 dark:text-rose-300",
    badge: "bg-rose-600 text-white",
    icon: <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
    label: "NOT COVERED / EXCLUDED",
  },
  INFORMATIONAL: {
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-300 dark:border-blue-800",
    text: "text-blue-800 dark:text-blue-300",
    badge: "bg-blue-600 text-white",
    icon: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
    label: "OFFICIAL GUIDELINES",
  },
};

const CRITERION_CONFIG: Record<
  CriterionResult,
  { icon: React.ReactNode; text: string; bg: string; border: string }
> = {
  PASS: {
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
    text: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50/80 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  FAIL: {
    icon: <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />,
    text: "text-red-700 dark:text-red-300",
    bg: "bg-red-50/80 dark:bg-red-950/20",
    border: "border-red-200 dark:border-red-800",
  },
  UNKNOWN: {
    icon: <HelpCircle className="w-4 h-4 text-slate-400" />,
    text: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-50/80 dark:bg-slate-900/30",
    border: "border-slate-200 dark:border-slate-800",
  },
  NOT_REQUIRED: {
    icon: <Info className="w-4 h-4 text-blue-500 dark:text-blue-400" />,
    text: "text-blue-700 dark:text-blue-300",
    bg: "bg-blue-50/60 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-800",
  },
};

const SOURCE_BADGES: Record<string, { label: string; style: string }> = {
  USER_PROVIDED: { label: "User Provided", style: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300" },
  USER_PROVIDED_DURING_INTERVIEW: { label: "Interview Answer", style: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300" },
  DOCUMENT_VERIFIED: { label: "Verified Document", style: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300" },
  PROFILE_CONTEXT: { label: "Profile Context", style: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300" },
  OFFICIAL_RULE: { label: "Official Policy", style: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300" },
};

// ─── CriterionRow ─────────────────────────────────────────────────────────────
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
  const sourceAttr = criterion.source || (criterion as any).source;
  const srcBadge = sourceAttr && SOURCE_BADGES[sourceAttr] ? SOURCE_BADGES[sourceAttr] : null;

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left"
      >
        <div className="flex items-center gap-2 flex-wrap">
          {cfg.icon}
          <span className={`text-xs font-semibold ${cfg.text}`}>
            {criterionName}
          </span>
          {srcBadge && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${srcBadge.style}`}>
              {srcBadge.label}
            </span>
          )}
          {isMissingInfo && (
            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
              Missing Info
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${cfg.border} ${cfg.text}`}>
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
          {(patientValue || requiredValue) && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {patientValue && (
                <div className="bg-white/80 rounded-lg p-2">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Your Value</p>
                  <p className="text-[11px] font-semibold text-slate-800 mt-0.5">{patientValue}</p>
                </div>
              )}
              {requiredValue && (
                <div className="bg-white/80 rounded-lg p-2">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Required</p>
                  <p className="text-[11px] font-semibold text-slate-800 mt-0.5">{requiredValue}</p>
                </div>
              )}
            </div>
          )}
          <p className="text-[11px] text-slate-600 leading-relaxed">{criterion.explanation}</p>
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
                  <div key={chunkId} className="bg-white/70 border border-slate-200 rounded-lg p-2.5">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3 text-teal-500 shrink-0" />
                        <span className="text-[10px] font-semibold text-teal-700 line-clamp-1">{docTitle}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {pageNum && <span className="text-[10px] text-slate-400">p.{pageNum}</span>}
                        <a href={officialUrl} target="_blank" rel="noopener noreferrer" className="text-teal-500 hover:text-teal-700">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-600 italic leading-relaxed line-clamp-3">
                      &ldquo;{src.excerpt}&rdquo;
                    </p>
                    {relScore !== undefined && (
                      <div className="mt-1.5 flex items-center gap-1">
                        <div className="h-1 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal-400 rounded-full"
                            style={{ width: `${Math.max(10, Math.min(100, Math.round(relScore * 100)))}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          Evidence Relevance: {Math.max(10, Math.min(100, Math.round(relScore * 100)))}%
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

// ─── InterviewAnswerPanel ─────────────────────────────────────────────────────
const InterviewAnswerPanel: React.FC<{
  questions: MissingCriterionItem[];
  queryId: string;
  onSubmit: (queryId: string, additionalInfo: Record<string, any>) => Promise<void>;
}> = ({ questions, queryId, onSubmit }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allAnswered = questions.every((q) => {
    const val = answers[q.field_key];
    return val !== undefined && val.trim() !== "";
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allAnswered) {
      setError("Please answer all questions before submitting.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(queryId, answers);
    } catch {
      setError("Failed to submit your answers. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getIcon = (fieldKey: string) => {
    if (fieldKey.includes("state") || fieldKey.includes("residency"))
      return <MapPin className="w-3.5 h-3.5 text-[#0D9488]" />;
    if (fieldKey.includes("age"))
      return <Calendar className="w-3.5 h-3.5 text-[#0D9488]" />;
    if (fieldKey.includes("income") || fieldKey.includes("salary"))
      return <IndianRupee className="w-3.5 h-3.5 text-[#0D9488]" />;
    return <HelpCircle className="w-3.5 h-3.5 text-[#0D9488]" />;
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 bg-white/80 dark:bg-slate-900/60 border border-blue-200 dark:border-blue-800 rounded-2xl p-4"
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <ClipboardCheck className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-900 dark:text-white">
            Please answer {questions.length === 1 ? "this question" : `these ${questions.length} questions`} to continue
          </p>
          <p className="text-[11px] text-slate-500">Your answers help evaluate your eligibility accurately</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs px-3 py-2 rounded-xl">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {questions.map((q) => {
          const inputType = q.input_type?.toUpperCase();
          const currentVal = answers[q.field_key] ?? "";

          return (
            <div key={q.criterion_id} className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                {getIcon(q.field_key)}
                <span>{q.label || q.question}</span>
              </label>
              <p className="text-[11px] text-slate-500 -mt-0.5">{q.question}</p>

              {/* MCQ / SELECT */}
              {(inputType === "MCQ" || inputType === "SELECT") && q.options && q.options.length > 0 ? (
                q.options.length <= 4 ? (
                  <div className="flex flex-col gap-2">
                    {q.options.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setAnswers((prev) => ({ ...prev, [q.field_key]: opt }))}
                        className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer text-xs ${
                          currentVal === opt
                            ? "bg-teal-500/10 border-[#0D9488] text-teal-900 dark:text-teal-200 ring-2 ring-teal-500/20 font-semibold"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            currentVal === opt ? "border-[#0D9488] bg-[#0D9488]" : "border-slate-400"
                          }`}
                        >
                          {currentVal === opt && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <select
                    value={currentVal}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [q.field_key]: e.target.value }))}
                    className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#0D9488]"
                  >
                    <option value="">Select an option...</option>
                    {q.options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )
              ) : inputType === "NUMBER" || inputType === "number" ? (
                <input
                  type="number"
                  min="0"
                  max="125"
                  placeholder="Enter a number"
                  value={currentVal}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.field_key]: e.target.value }))}
                  className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#0D9488]"
                />
              ) : (
                <input
                  type="text"
                  placeholder={q.question}
                  value={currentVal}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.field_key]: e.target.value }))}
                  className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#0D9488]"
                />
              )}
            </div>
          );
        })}
      </div>

      <button
        type="submit"
        disabled={!allAnswered || submitting}
        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer self-end"
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ArrowRight className="w-4 h-4" />
        )}
        {submitting ? "Checking eligibility..." : "Submit & Check Eligibility"}
      </button>
    </form>
  );
};

// ─── Main Export ──────────────────────────────────────────────────────────────
export const MultiDocEligibilityCard: React.FC<MultiDocEligibilityCardProps> = ({
  result,
  onContinue,
}) => {
  if (!result) return null;

  const rawStatus = result.overall_status || (result as any).overallStatus || "INSUFFICIENT_INFORMATION";
  const status = rawStatus as EligibilityStatus;
  const cfg = OVERALL_STATUS_CONFIG[status] || OVERALL_STATUS_CONFIG.INSUFFICIENT_INFORMATION;

  const rawCriteria = result.criteria_breakdown || (result as any).criteriaBreakdown || [];
  const criteriaBreakdown: EligibilityCriterion[] = Array.isArray(rawCriteria) ? rawCriteria : [];

  const rawEvidence = result.all_evidence_sources || (result as any).allEvidenceSources || [];
  const evidenceSources: EvidenceSource[] = Array.isArray(rawEvidence) ? rawEvidence : [];

  const rawMissing = result.structured_missing_criteria || (result as any).structuredMissingCriteria || [];
  const structuredMissingCriteria: MissingCriterionItem[] = Array.isArray(rawMissing) ? rawMissing : [];

  const interviewState = result.interview_state || (result as any).interviewState;
  const queryId = result.query_id || (result as any).queryId || "";
  const progress = result.progress || (result as any).progress;

  const needsInterview =
    (interviewState === "QUESTIONS_REQUIRED" || interviewState === "PROFILE_DATA_REQUIRED" || status === "PROFILE_DATA_REQUIRED") &&
    structuredMissingCriteria.length > 0 &&
    !!onContinue;

  const passCount = criteriaBreakdown.filter((c) => (c?.criterion_result || (c as any)?.criterionResult) === "PASS").length;
  const failCount = criteriaBreakdown.filter((c) => (c?.criterion_result || (c as any)?.criterionResult) === "FAIL").length;
  const unknownCount = criteriaBreakdown.filter((c) => (c?.criterion_result || (c as any)?.criterionResult) === "UNKNOWN").length;
  const notRequiredCount = criteriaBreakdown.filter((c) => (c?.criterion_result || (c as any)?.criterionResult) === "NOT_REQUIRED").length;

  const queryType = result.query_type || (result as any).queryType || "PERSONAL_ELIGIBILITY";
  const breakdownTitle =
    queryType === "COVERAGE" || queryType === "COVERAGE_QUERY"
      ? "Coverage & Package Inclusions Breakdown"
      : queryType === "REQUIREMENTS" || queryType === "REQUIREMENTS_QUERY"
      ? "Document & Eligibility Criteria Framework"
      : queryType === "GENERAL_INFORMATION"
      ? "Scheme Highlights & Key Specifications"
      : "Criterion-Level Eligibility Breakdown";

  const matchPercentage =
    result.match_percentage !== undefined && result.match_percentage !== null
      ? result.match_percentage
      : passCount + failCount + unknownCount > 0
      ? Math.round((passCount / (passCount + failCount + unknownCount)) * 100)
      : null;

  const explanationText = result.overall_explanation || (result as any).overallExplanation || "";

  return (
    <Card className={`border-2 ${cfg.border} ${cfg.bg} p-5 flex flex-col gap-4`}>
      {/* Status Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/80 dark:bg-slate-800/80 border-2 border-white/60 dark:border-slate-700 flex items-center justify-center">
            {cfg.icon}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-block text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mb-0.5 ${cfg.badge}`}>
                {cfg.label}
              </span>
              {matchPercentage !== null && !needsInterview && (queryType === "PERSONAL_ELIGIBILITY" || !queryType) && (
                <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md bg-teal-600 text-white shadow-sm">
                  {matchPercentage}% Criteria Match
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Based on {evidenceSources.length} official document chunk(s) retrieved
            </p>
          </div>
        </div>

        {/* Pill counters */}
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
          {passCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {passCount} PASS
            </span>
          )}
          {failCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
              {failCount} FAIL
            </span>
          )}
          {unknownCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {unknownCount} UNKNOWN
            </span>
          )}
          {notRequiredCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {notRequiredCount} NOT REQUIRED
            </span>
          )}
        </div>
      </div>

      {/* Interview Progress Bar */}
      {progress && (
        <div className="bg-white/70 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
            <span>Interview Progress</span>
            <span className="text-teal-600 dark:text-teal-400">
              {progress.answered} / {progress.total_required} answered
            </span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 transition-all duration-500 rounded-full"
              style={{
                width: `${progress.total_required > 0 ? Math.round((progress.answered / progress.total_required) * 100) : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Match % bar (only when no interview needed) */}
      {matchPercentage !== null && !needsInterview && (queryType === "PERSONAL_ELIGIBILITY" || !queryType) && (
        <div className="bg-white/70 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
            <span>Eligibility Criteria Match</span>
            <span className="text-teal-600 dark:text-teal-400">{matchPercentage}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                matchPercentage === 100 ? "bg-emerald-500" : matchPercentage >= 50 ? "bg-amber-500" : "bg-red-500"
              }`}
              style={{ width: `${matchPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Overall Explanation */}
      <p className={`text-xs leading-relaxed ${cfg.text}`}>{explanationText}</p>

      {/* Interactive Answer Panel (when interview is active and onContinue is wired) */}
      {needsInterview && (
        <InterviewAnswerPanel
          questions={structuredMissingCriteria}
          queryId={queryId}
          onSubmit={onContinue!}
        />
      )}

      {/* Fallback: show list of questions when onContinue not wired */}
      {(interviewState === "QUESTIONS_REQUIRED" || status === "PROFILE_DATA_REQUIRED") &&
        structuredMissingCriteria.length > 0 &&
        !onContinue && (
          <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl px-3 py-2.5 text-xs text-blue-800 dark:text-blue-300">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
            <div>
              <p className="font-semibold mb-1">Please provide the following to complete your assessment:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {structuredMissingCriteria.map((q) => (
                  <li key={q.criterion_id}>{q.label}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

      {/* Criteria Breakdown */}
      {criteriaBreakdown.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {breakdownTitle}
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
