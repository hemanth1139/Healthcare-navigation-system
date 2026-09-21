"use client";

import React, { useState, useEffect } from "react";
import { HistoryItem, HistoryTypeFilter, HistoryDateRange, ConsultationHistoryType } from "@/types/history";
import { historyApi } from "@/lib/mockHistoryData";
import { Spinner } from "@/components/ui/Spinner";
import { Card } from "@/components/ui/Card";
import { SeverityUrgencyCard } from "@/components/assessment/SeverityUrgencyCard";
import { MOCK_ASSESSMENTS } from "@/lib/mockAssessmentData";
import {
  ClipboardList,
  Stethoscope,
  ShieldAlert,
  FolderUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Siren,
  Calendar,
  Filter,
  FileText,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

const TYPE_FILTERS: { value: HistoryTypeFilter; label: string; icon: React.ReactNode }[] = [
  { value: "All", label: "All History", icon: <ClipboardList className="w-4 h-4" /> },
  {
    value: "symptom_consultation",
    label: "Consultations",
    icon: <Stethoscope className="w-4 h-4" />,
  },
  { value: "scheme_query", label: "Scheme Queries", icon: <ShieldAlert className="w-4 h-4" /> },
  {
    value: "document_upload",
    label: "Document Uploads",
    icon: <FolderUp className="w-4 h-4" />,
  },
];

const DATE_FILTERS: { value: HistoryDateRange; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "30d", label: "Last 30 days" },
  { value: "7d", label: "Last 7 days" },
];

const URGENCY_ICON: Record<string, React.ReactNode> = {
  EMERGENCY: <Siren className="w-3.5 h-3.5 text-red-600" />,
  URGENT: <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />,
  NON_URGENT: <Clock className="w-3.5 h-3.5 text-amber-600" />,
  ROUTINE: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
};

const URGENCY_BADGE: Record<string, string> = {
  EMERGENCY: "bg-red-100 text-red-700 border-red-200",
  URGENT: "bg-orange-100 text-orange-700 border-orange-200",
  NON_URGENT: "bg-amber-100 text-amber-700 border-amber-200",
  ROUTINE: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const SCHEME_STATUS_BADGE: Record<string, string> = {
  ELIGIBLE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  NOT_ELIGIBLE: "bg-red-100 text-red-700 border-red-200",
  POSSIBLY_ELIGIBLE: "bg-amber-100 text-amber-700 border-amber-200",
  INSUFFICIENT_INFORMATION: "bg-slate-100 text-slate-600 border-slate-200",
};

const TYPE_ICON: Record<ConsultationHistoryType, React.ReactNode> = {
  symptom_consultation: <Stethoscope className="w-4 h-4 text-teal-600" />,
  scheme_query: <ShieldAlert className="w-4 h-4 text-purple-600" />,
  document_upload: <FolderUp className="w-4 h-4 text-slate-500" />,
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupByRelativeGroup(items: HistoryItem[]) {
  const groups: Record<string, HistoryItem[]> = {};
  items.forEach((item) => {
    if (!groups[item.relativeGroup]) groups[item.relativeGroup] = [];
    groups[item.relativeGroup].push(item);
  });
  return groups;
}

const GROUP_ORDER = ["Today", "Yesterday", "This Week", "Earlier"];

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<HistoryTypeFilter>("All");
  const [dateRange, setDateRange] = useState<HistoryDateRange>("all");
  const [expandedAssessmentId, setExpandedAssessmentId] = useState<string | null>(null);
  const { t, language } = useLanguage();

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const data = await historyApi.getHistory(selectedType, dateRange);
        setItems(data);
      } catch (err) {
        console.error("Failed to load history items", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [selectedType, dateRange]);

  const grouped = groupByRelativeGroup(items);

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto py-2">
      {/* Page Header */}
      <div className="border-b border-[#F0FDFA] pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
              {t.history}
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1">
              {language === "ta"
                ? "அறிகுறி ஆலோசனைகள், அவசர நிலை மதிப்பீடுகள் மற்றும் திட்ட தகுதிகள் பற்றிய வரலாறு"
                : "Full history of symptom consultations, severity assessments, scheme eligibility queries, and document uploads"}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Type Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setSelectedType(f.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                selectedType === f.value
                  ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:border-teal-300"
              }`}
            >
              {f.icon}
              {f.label}
            </button>
          ))}
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-1.5 ml-auto">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as HistoryDateRange)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            {DATE_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 min-h-[300px]">
          <Spinner size="lg" color="primary" />
          <span className="text-xs text-[#64748B] mt-2">Loading consultation history...</span>
        </div>
      ) : items.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center border-dashed">
          <ClipboardList className="w-10 h-10 text-slate-300" />
          <p className="text-sm font-semibold text-slate-500">No history found</p>
          <p className="text-xs text-slate-400">
            Start a symptom consultation or query a government scheme to see your history here.
          </p>
          <Link
            href="/symptom-chat"
            className="mt-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors"
          >
            Start Symptom Check
          </Link>
        </Card>
      ) : (
        <div className="flex flex-col gap-8">
          {GROUP_ORDER.filter((g) => grouped[g]).map((group) => (
            <div key={group}>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                {group}
              </p>
              <div className="flex flex-col gap-3">
                {grouped[group].map((item) => {
                  const payload = item.detailsPayload;
                  const isConsultation = item.type === "symptom_consultation";
                  const isScheme = item.type === "scheme_query";
                  const isDocument = item.type === "document_upload";
                  const assessment =
                    expandedAssessmentId === item.id && isConsultation
                      ? MOCK_ASSESSMENTS.find(
                          (a) => a.urgency_level === payload?.urgency_level
                        ) || null
                      : null;

                  return (
                    <Card
                      key={item.id}
                      className="border border-slate-100 hover:border-teal-200 hover:shadow-sm transition-all p-4 flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* Left: Icon + Title */}
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                            {TYPE_ICON[item.type as ConsultationHistoryType]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                              {item.subtitle}
                            </p>
                            <p className="text-[10px] font-mono text-slate-400 mt-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(item.timestamp)}
                            </p>
                          </div>
                        </div>

                        {/* Right: Badges + Action */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {isConsultation && payload?.urgency_level && (
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                URGENCY_BADGE[payload.urgency_level]
                              }`}
                            >
                              {URGENCY_ICON[payload.urgency_level]}
                              {payload.urgency_level.replace("_", " ")}
                            </span>
                          )}
                          {isScheme && payload?.overall_status && (
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                SCHEME_STATUS_BADGE[payload.overall_status]
                              }`}
                            >
                              {payload.overall_status.replace("_", " ")}
                            </span>
                          )}
                          {isDocument && payload?.processing_status && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-slate-100 text-slate-600 border-slate-200 uppercase">
                              {payload.processing_status}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Details Preview */}
                      {isConsultation && payload && (
                        <div className="grid grid-cols-3 gap-2">
                          {payload.primary_symptom && (
                            <div className="bg-slate-50 rounded-lg p-2">
                              <p className="text-[10px] font-semibold text-slate-400 uppercase">
                                Primary Symptom
                              </p>
                              <p className="text-[11px] font-medium text-slate-800 mt-0.5 line-clamp-1">
                                {payload.primary_symptom}
                              </p>
                            </div>
                          )}
                          {payload.specialist_recommended && (
                            <div className="bg-slate-50 rounded-lg p-2">
                              <p className="text-[10px] font-semibold text-slate-400 uppercase">
                                Specialist
                              </p>
                              <p className="text-[11px] font-medium text-slate-800 mt-0.5 line-clamp-1">
                                {payload.specialist_recommended}
                              </p>
                            </div>
                          )}
                          {payload.total_turns && (
                            <div className="bg-slate-50 rounded-lg p-2">
                              <p className="text-[10px] font-semibold text-slate-400 uppercase">
                                Turns
                              </p>
                              <p className="text-[11px] font-medium text-slate-800 mt-0.5">
                                {payload.total_turns} exchanges
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {isScheme && payload?.user_question && (
                        <div className="bg-slate-50 rounded-lg p-2.5">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase mb-0.5">
                            Query
                          </p>
                          <p className="text-[11px] text-slate-700 line-clamp-2">
                            {payload.user_question}
                          </p>
                          {payload.ai_answer_excerpt && (
                            <p className="text-[11px] italic text-slate-500 mt-1 line-clamp-2">
                              &ldquo;{payload.ai_answer_excerpt}&rdquo;
                            </p>
                          )}
                        </div>
                      )}

                      {isDocument && payload && (
                        <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-2.5">
                          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-slate-800 truncate">
                              {payload.file_name}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {payload.document_type_label}
                              {payload.scheme_name ? ` • ${payload.scheme_name}` : ""}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Expandable: Full Assessment Preview for consultations */}
                      {isConsultation && (
                        <button
                          onClick={() =>
                            setExpandedAssessmentId(
                              expandedAssessmentId === item.id ? null : item.id
                            )
                          }
                          className="flex items-center gap-1 text-xs font-semibold text-teal-600 hover:underline self-start"
                        >
                          {expandedAssessmentId === item.id
                            ? "Hide Assessment"
                            : "View Full Assessment"}
                          <ChevronRight
                            className={`w-3.5 h-3.5 transition-transform ${
                              expandedAssessmentId === item.id ? "rotate-90" : ""
                            }`}
                          />
                        </button>
                      )}

                      {assessment && (
                        <div className="mt-1">
                          <SeverityUrgencyCard assessment={assessment} compact />
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
