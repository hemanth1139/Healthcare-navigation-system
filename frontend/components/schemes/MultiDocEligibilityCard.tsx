"use client";

import React, { useState } from "react";
import Link from "next/link";
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
  Briefcase,
  Accessibility,
  Baby,
} from "lucide-react";

interface MultiDocEligibilityCardProps {
  result: MultiDocEligibilityResult;
  /** Called when user submits answers in the interactive interview. Pass this from the parent page. */
  onContinue?: (queryId: string, additionalInfo: Record<string, string>) => Promise<void>;
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

const parseInlineStyles = (content: string) => {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
};

const renderFormattedText = (text: string) => {
  if (!text) return null;
  const lines = text.split("\n");
  return (
    <div className="flex flex-col gap-1">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }
        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={idx} className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white mt-2">
              {trimmed.replace(/^###\s+/, "")}
            </h4>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h3 key={idx} className="font-bold text-sm sm:text-base text-slate-900 dark:text-white mt-2.5">
              {trimmed.replace(/^##\s+/, "")}
            </h3>
          );
        }
        if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
          const content = trimmed.replace(/^[\*\-]\s+/, "");
          return (
            <div key={idx} className="flex items-start gap-2 ml-1 my-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
              <span className="leading-relaxed">{parseInlineStyles(content)}</span>
            </div>
          );
        }
        return (
          <p key={idx} className="my-0.5 leading-relaxed">
            {parseInlineStyles(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

// ─── CriterionRow ─────────────────────────────────────────────────────────────
type FlexCriterion = EligibilityCriterion & {
  criterionId?: string;
  criterionResult?: CriterionResult;
  criterionName?: string;
  patientValue?: string;
  requiredValue?: string;
  isMissingInfo?: boolean;
  supportingEvidence?: EvidenceSource[];
};

const CriterionRow: React.FC<{ criterion: EligibilityCriterion }> = ({ criterion }) => {
  const [expanded, setExpanded] = useState(false);
  if (!criterion) return null;
  const flex = criterion as FlexCriterion;
  const criterionResult = (criterion.criterion_result || flex.criterionResult || "UNKNOWN") as CriterionResult;
  const cfg = CRITERION_CONFIG[criterionResult] || CRITERION_CONFIG.UNKNOWN;
  const criterionName = criterion.criterion_name || flex.criterionName || "Criterion";
  const patientValue = criterion.patient_value || flex.patientValue;
  const requiredValue = criterion.required_value || flex.requiredValue;
  const isMissingInfo = criterion.is_missing_info || flex.isMissingInfo;
  const rawEvidence = criterion.supporting_evidence || flex.supportingEvidence || [];
  const supportingEvidence: EvidenceSource[] = Array.isArray(rawEvidence) ? rawEvidence : [];
  const sourceAttr = criterion.source;
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
                type FlexEvidence = EvidenceSource & { documentTitle?: string; pageNumber?: number; officialUrl?: string; relevanceScore?: number; chunkId?: string; };
                const fsrc = src as FlexEvidence;
                const docTitle = src.document_title || fsrc.documentTitle || "Scheme Document";
                const pageNum = src.page_number || fsrc.pageNumber;
                const officialUrl = src.official_url || fsrc.officialUrl || "https://pmjay.gov.in";
                const relScore = src.relevance_score || fsrc.relevanceScore;
                const chunkId = src.chunk_id || fsrc.chunkId || `chk_${idx}`;
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
  onSubmit: (queryId: string, additionalInfo: Record<string, string>) => Promise<void>;
}> = ({ questions, queryId, onSubmit }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getQuestionKey = (q: MissingCriterionItem, idx: number): string => {
    const fq = q as MissingCriterionItem & { field_key?: string; fieldKey?: string; criterionId?: string };
    return fq?.field_key || fq?.fieldKey || fq?.criterion_id || fq?.criterionId || `question_${idx}`;
  };

  const allAnswered = questions.every((q, idx) => {
    const key = getQuestionKey(q, idx);
    const val = answers[key];
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

  const getIcon = (fieldKey?: string) => {
    if (!fieldKey || typeof fieldKey !== "string") {
      return <HelpCircle className="w-3.5 h-3.5 text-[#0D9488]" />;
    }
    const lowerKey = fieldKey.toLowerCase();
    if (lowerKey.includes("state") || lowerKey.includes("residency"))
      return <MapPin className="w-3.5 h-3.5 text-[#0D9488]" />;
    if (lowerKey.includes("age") || lowerKey.includes("dob") || lowerKey.includes("birth"))
      return <Calendar className="w-3.5 h-3.5 text-[#0D9488]" />;
    if (lowerKey.includes("income") || lowerKey.includes("salary") || lowerKey.includes("financial"))
      return <IndianRupee className="w-3.5 h-3.5 text-[#0D9488]" />;
    if (lowerKey.includes("employment") || lowerKey.includes("job") || lowerKey.includes("work"))
      return <Briefcase className="w-3.5 h-3.5 text-[#0D9488]" />;
    if (lowerKey.includes("disability") || lowerKey.includes("disabled"))
      return <Accessibility className="w-3.5 h-3.5 text-[#0D9488]" />;
    if (lowerKey.includes("pregnancy") || lowerKey.includes("pregnant"))
      return <Baby className="w-3.5 h-3.5 text-[#0D9488]" />;
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
        {questions.map((q: MissingCriterionItem, idx: number) => {
          const key = getQuestionKey(q, idx);
          const inputType = (q.input_type || q.inputType || "TEXT")?.toUpperCase();
          const currentVal = answers[key] ?? "";
          const options: string[] = q.options || [];

          return (
            <div key={q.criterion_id || q.criterionId || key} className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                {getIcon(key)}
                <span>{q.label || q.question}</span>
              </label>
              <p className="text-[11px] text-slate-500 -mt-0.5">{q.question}</p>

              {/* MCQ / SELECT */}
              {(inputType === "MCQ" || inputType === "SELECT") && options.length > 0 ? (
                options.length <= 4 ? (
                  <div className="flex flex-col gap-2">
                    {options.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setAnswers((prev) => ({ ...prev, [key]: opt }))}
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
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#0D9488]"
                  >
                    <option value="">Select an option...</option>
                    {options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )
              ) : inputType === "NUMBER" ? (
                <input
                  type="number"
                  min="0"
                  max="125"
                  placeholder="Enter a number"
                  value={currentVal}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#0D9488]"
                />
              ) : (
                <input
                  type="text"
                  placeholder={q.question}
                  value={currentVal}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [key]: e.target.value }))}
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

  type FlexResult = MultiDocEligibilityResult & {
    overallStatus?: EligibilityStatus;
    criteriaBreakdown?: EligibilityCriterion[];
    allEvidenceSources?: EvidenceSource[];
    structuredMissingCriteria?: MissingCriterionItem[];
    interviewState?: string;
    queryId?: string;
    queryType?: string;
    overallExplanation?: string;
  };
  const flexResult = result as FlexResult;

  const rawStatus = result.overall_status || flexResult.overallStatus || "INSUFFICIENT_INFORMATION";
  const status = rawStatus as EligibilityStatus;
  const cfg = OVERALL_STATUS_CONFIG[status] || OVERALL_STATUS_CONFIG.INSUFFICIENT_INFORMATION;

  const rawCriteria = result.criteria_breakdown || flexResult.criteriaBreakdown || [];
  const criteriaBreakdown: EligibilityCriterion[] = Array.isArray(rawCriteria) ? rawCriteria : [];

  const rawEvidence = result.all_evidence_sources || flexResult.allEvidenceSources || [];
  const evidenceSources: EvidenceSource[] = Array.isArray(rawEvidence) ? rawEvidence : [];

  const rawMissing = result.structured_missing_criteria || flexResult.structuredMissingCriteria || [];
  const structuredMissingCriteria: MissingCriterionItem[] = Array.isArray(rawMissing) ? rawMissing : [];

  const interviewState = result.interview_state || flexResult.interviewState;
  const queryId = result.query_id || flexResult.queryId || "";
  const progress = result.progress;

  const needsInterview =
    (interviewState === "QUESTIONS_REQUIRED" || interviewState === "PROFILE_DATA_REQUIRED" || status === "PROFILE_DATA_REQUIRED") &&
    structuredMissingCriteria.length > 0 &&
    !!onContinue;

  const passCount = criteriaBreakdown.filter((c) => ((c as FlexCriterion)?.criterion_result || (c as FlexCriterion)?.criterionResult) === "PASS").length;
  const failCount = criteriaBreakdown.filter((c) => ((c as FlexCriterion)?.criterion_result || (c as FlexCriterion)?.criterionResult) === "FAIL").length;
  const unknownCount = criteriaBreakdown.filter((c) => ((c as FlexCriterion)?.criterion_result || (c as FlexCriterion)?.criterionResult) === "UNKNOWN").length;
  const notRequiredCount = criteriaBreakdown.filter((c) => ((c as FlexCriterion)?.criterion_result || (c as FlexCriterion)?.criterionResult) === "NOT_REQUIRED").length;

  const queryType = result.query_type || flexResult.queryType || "PERSONAL_ELIGIBILITY";
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

  const explanationText = result.overall_explanation || flexResult.overallExplanation || "";

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

      {/* Profile Completion Status Banner */}
      {result.profile_complete === false && result.missing_required_fields && result.missing_required_fields.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="flex flex-col gap-1">
              <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Incomplete Profile Details for Full Assessment
              </p>
              <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                Some criteria could not be fully verified because your profile is missing:{" "}
                <span className="font-semibold">{result.missing_required_fields.join(", ")}</span>.
              </p>
            </div>
          </div>
          <Link
            href="/profile"
            className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-200/60 dark:bg-amber-900/40 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            Update Profile
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {result.profile_complete === true && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3.5 py-2 flex items-center justify-between gap-3 text-[11px] text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold">
              Assessed using your authenticated patient profile data (State, Age, Income &amp; Health details)
            </span>
          </div>
          <Link href="/profile" className="text-emerald-700 dark:text-emerald-300 underline font-medium hover:text-emerald-900 shrink-0">
            Edit profile
          </Link>
        </div>
      )}

      {/* Overall Explanation */}
      <div className={`text-xs leading-relaxed ${cfg.text}`}>
        {renderFormattedText(explanationText)}
      </div>

      {/* Eligible Schemes Grid (for MULTI_SCHEME queries) */}
      {(queryType === "MULTI_SCHEME_ELIGIBILITY_QUERY" || (evidenceSources.length > 0 && evidenceSources.some((e) => e.scheme_id))) && (
        <div className="flex flex-col gap-3 mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Matched Healthcare Schemes ({evidenceSources.length})
            </p>
            <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">
              Click &quot;Check Eligibility&quot; for personalized assessment
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {evidenceSources.map((source, idx) => {
              type FlexSource = EvidenceSource & {
                schemeId?: string;
                schemeName?: string;
                documentTitle?: string;
                relevanceScore?: number;
                governmentLevel?: string;
                government_level?: string;
                matchPercentage?: number;
                match_percentage?: number;
                coverageAmount?: string;
                coverage_amount?: string;
                officialUrl?: string;
              };
              const fsource = source as FlexSource;
              const sId = String(source.scheme_id || fsource.schemeId || `s_${idx}`);
              const sName = source.scheme_name || fsource.schemeName || source.document_title || fsource.documentTitle || "Healthcare Scheme";
              const sGov = String(source.government_level || fsource.governmentLevel || (sId.includes("TN") ? "Tamil Nadu" : "Central Government"));
              const sMatch = source.match_percentage ?? fsource.matchPercentage ?? (source.relevance_score ? Math.round(source.relevance_score * 100) : 100);
              const sRelevance = source.relevance_score ?? fsource.relevanceScore ?? sMatch;
              const sCoverage = source.coverage_amount || fsource.coverageAmount || "Per official guidelines";
              const sUrl = source.official_url || fsource.officialUrl;

              return (
                <div
                  key={`${sId}_${idx}`}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 flex flex-col justify-between gap-2.5 shadow-sm hover:border-teal-500/50 hover:shadow-md transition-all group"
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        sGov.includes("Tamil") ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300" : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                      }`}>
                        {sGov}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {sMatch}% Match
                      </span>
                      {sRelevance !== sMatch && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                          {sRelevance}% Relevance
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {sName}
                    </h4>

                    {sCoverage && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1 font-medium">
                        <IndianRupee className="w-3 h-3 text-teal-600 shrink-0" />
                        <span>{sCoverage}</span>
                      </p>
                    )}

                    {source.excerpt && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {source.excerpt}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <Link
                      href={`/schemes/${sId}/eligibility`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 hover:underline"
                    >
                      Check Eligibility
                      <ArrowRight className="w-3 h-3" />
                    </Link>

                    {sUrl && (
                      <a
                        href={sUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        Official Portal
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                {structuredMissingCriteria.map((q: MissingCriterionItem, idx: number) => (
                  <li key={q.criterion_id || (q as MissingCriterionItem & { criterionId?: string }).criterionId || idx}>{q.label || q.question}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

      {/* Criteria Breakdown (for single-scheme evaluation) */}
      {criteriaBreakdown.length > 0 && queryType !== "MULTI_SCHEME_ELIGIBILITY_QUERY" && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {breakdownTitle}
          </p>
          {criteriaBreakdown.map((criterion, idx) => (
            <CriterionRow
              key={criterion?.criterion_id || (criterion as FlexCriterion)?.criterionId || `cr_${idx}`}
              criterion={criterion}
            />
          ))}
        </div>
      )}

      {/* Official Policy Citations (for single-scheme queries) */}
      {queryType !== "MULTI_SCHEME_ELIGIBILITY_QUERY" && evidenceSources.length > 0 && (
        <details className="mt-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white/50 dark:bg-slate-900/50 p-3 group">
          <summary className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer flex items-center justify-between">
            <span>Official Policy Documents & Citations ({evidenceSources.length} excerpts)</span>
            <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
          </summary>
          <div className="flex flex-col gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            {evidenceSources.map((source, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
                <p className="font-semibold text-[11px] text-slate-800 dark:text-slate-200 mb-1">
                  {source.document_title || source.scheme_name || `Excerpt #${i + 1}`}
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {source.excerpt}
                </p>
                {source.official_url && (
                  <a
                    href={source.official_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-teal-600 dark:text-teal-400 mt-1.5 hover:underline"
                  >
                    View official source
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </details>
      )}
    </Card>
  );
};
