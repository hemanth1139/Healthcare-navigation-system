"use client";

import React, { useState, useEffect, useCallback } from "react";
import { GovernmentScheme, SchemeQuery, MultiDocEligibilityResult } from "@/types/scheme";
import { schemeApi } from "@/lib/schemeApi";
import { api } from "@/lib/api";
import { MultiDocEligibilityCard } from "@/components/schemes/MultiDocEligibilityCard";
import { SchemeFilterChips } from "@/components/schemes/SchemeFilterChips";
import { SchemeSearchBar } from "@/components/schemes/SchemeSearchBar";
import { SchemeList } from "@/components/schemes/SchemeList";
import { FollowUpSuggestions } from "@/components/schemes/FollowUpSuggestions";
import { Spinner } from "@/components/ui/Spinner";
import { Card } from "@/components/ui/Card";
import {
  ShieldAlert,
  Send,
  Info,
  FileText,
  ArrowRight,
  Loader2,
  Clock,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ClipboardList,
  AlertTriangle,
  User,
  AlertCircle,
  RotateCw,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

/** Phrases that trigger the intake card before querying */
const OPEN_ENDED_KEYWORDS = [
  "what are the schemes am i eligible for",
  "what schemes am i eligible for",
  "which schemes am i eligible for",
  "am i eligible for any schemes",
  "what schemes can i get",
  "find schemes for me",
  "schemes for me",
  "what am i eligible for",
  "show me schemes",
  "list schemes",
  "available schemes",
  "eligible schemes",
];

function isOpenEndedQuery(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return OPEN_ENDED_KEYWORDS.some((kw) => lower.includes(kw));
}

export default function SchemesLandingPage() {
  const [schemes, setSchemes] = useState<GovernmentScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const { t, language } = useLanguage();

  // Multi-doc eligibility RAG state
  const [question, setQuestion] = useState("");
  const [queryLoading, setQueryLoading] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState<MultiDocEligibilityResult | null>(null);
  const [activeQueryId, setActiveQueryId] = useState<string | null>(null);
  const [followUpSuggestions, setFollowUpSuggestions] = useState<string[]>([]);
  const [queryError, setQueryError] = useState<{ title: string; message: string; isRetryable: boolean } | null>(null);
  const [lastFailedQuery, setLastFailedQuery] = useState<{ text: string; additionalInfo?: Record<string, any> } | null>(null);

  // Intake card state — shown when user types an open-ended query
  const [showIntakeCard, setShowIntakeCard] = useState(false);

  // Past queries history
  const [pastQueries, setPastQueries] = useState<SchemeQuery[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Profile completion check
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  const fetchSchemes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await schemeApi.getSchemes(selectedCategory, searchQuery);
      setSchemes(data);
    } catch (err) {
      console.error("Failed to load schemes", err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const hist = await schemeApi.getUserQueryHistory();
      setPastQueries(hist);
    } catch (err) {
      console.warn("Could not fetch user scheme query history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, [fetchSchemes]);

  useEffect(() => {
    loadHistory();
  }, []);

  // Check profile completion
  useEffect(() => {
    const checkProfile = async () => {
      try {
        const profileRes = await api.get("/profile");
        const profile = profileRes.data;
        const hasRequiredFields = Boolean(
          profile.gender &&
          profile.dateOfBirth &&
          profile.bloodGroup &&
          (profile.city || profile.state) &&
          profile.address &&
          profile.annualIncome &&
          (profile.employmentStatus || profile.employment_status) &&
          profile.familySize
        );
        setIsProfileComplete(hasRequiredFields);
      } catch (err) {
        console.warn("Could not check profile completion:", err);
      }
    };
    checkProfile();
  }, []);

  const parseErrorMessage = (err: any): { title: string; message: string; isRetryable: boolean } => {
    if (!err?.response) {
      // Genuine network connectivity error or server unreachable
      return {
        title: "Connection Error",
        message: "Unable to reach the government schemes server. Please verify your network connection and ensure the backend service is running.",
        isRetryable: true,
      };
    }

    const status = err.response.status;
    const detail = err.response.data?.detail || err.response.data?.message;

    if (status === 401 || status === 403) {
      return {
        title: "Authentication Required",
        message: "Your session may have expired. Please sign in again to evaluate scheme eligibility.",
        isRetryable: false,
      };
    }

    if (status === 422 || status === 400) {
      return {
        title: "Invalid Query Parameters",
        message: detail || "Please check your query text or demographic details and try again.",
        isRetryable: false,
      };
    }

    if (status >= 500) {
      return {
        title: "Eligibility Analysis Unavailable",
        message: "The eligibility assessment service encountered a temporary error while processing the official scheme guidelines. Please retry in a moment.",
        isRetryable: true,
      };
    }

    return {
      title: "Query Error",
      message: detail || "An unexpected issue occurred while evaluating your scheme eligibility. Please try again.",
      isRetryable: true,
    };
  };

  /** Core query function — submits to the RAG pipeline */
  const runQuery = async (text: string, additionalInfo?: Record<string, any>) => {
    setQueryLoading(true);
    setQueryError(null);
    setLastFailedQuery(null);
    setEligibilityResult(null);
    setActiveQueryId(null);
    setFollowUpSuggestions([]);
    try {
      const { query, eligibilityResult: result } = await schemeApi.querySchemeEligibility(text, undefined, additionalInfo);
      setEligibilityResult(result);
      // Capture follow-up suggestions
      if (query?.follow_up_suggestions) {
        setFollowUpSuggestions(query.follow_up_suggestions);
      }
      // Track the query_id so we can continue the interview
      const qId = query?.query_id || (query as any)?.queryId || result?.query_id || (result as any)?.queryId || null;
      setActiveQueryId(qId);
      loadHistory();
    } catch (err: any) {
      console.error("Eligibility query failed:", err);
      const parsed = parseErrorMessage(err);
      setQueryError(parsed);
      setLastFailedQuery({ text, additionalInfo });
    } finally {
      setQueryLoading(false);
    }
  };

  const handleQuery = async (customQ?: string) => {
    const text = (customQ || question).trim();
    if (!text) return;

    await runQuery(text);
  };

  /** Called when MultiDocEligibilityCard's interview panel submits answers */
  const handleContinueInterview = async (queryId: string, additionalInfo: Record<string, any>) => {
    setQueryLoading(true);
    setQueryError(null);
    try {
      const { eligibilityResult: result } = await schemeApi.continueEligibility(queryId, additionalInfo);
      setEligibilityResult(result);
      const newQId = result?.query_id || queryId;
      setActiveQueryId(newQId);
      loadHistory();
    } catch (err: any) {
      console.error("Continue eligibility failed:", err);
      const parsed = parseErrorMessage(err);
      setQueryError(parsed);
    } finally {
      setQueryLoading(false);
    }
  };

  const retryLastQuery = () => {
    if (lastFailedQuery) {
      runQuery(lastFailedQuery.text, lastFailedQuery.additionalInfo);
    } else if (question.trim()) {
      runQuery(question.trim());
    }
  };

  const exampleQuestions = language === "ta" ? [
    "எனக்கு 72 வயதாக இருந்தால் ஆயுஷ்மான் வய வந்தனா திட்டத்திற்கு தகுதி உண்டா?",
    "பிஎம்-ஜேஏஒய் (PM-JAY) திட்டத்தின் கீழ் அழகு சாதன சிகிச்சை சேர்க்கப்பட்டுள்ளதா?",
    "பிஎம்-ஜேஏஒய் திட்டத்திற்கு நான் தகுதியானவனா?",
  ] : [
    "Am I eligible for Ayushman Vay Vandana if I am 70+ years old?",
    "Is cosmetic or aesthetic surgery covered under PM-JAY?",
    "What are the income and document requirements for Ayushman Bharat PM-JAY?",
  ];

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto py-2">
      {/* Page Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-[#0D9488] text-white flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t.schemeTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t.schemeSubtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Profile Incomplete Warning Banner */}
      {!isProfileComplete && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-bold text-amber-900">
                Complete Your Profile for Accurate Eligibility Check
              </h3>
              <p className="text-xs text-amber-700 mt-1">
                Your profile is missing required information (age, location, etc.) needed to evaluate government scheme eligibility accurately.
              </p>
            </div>
          </div>
          <Link
            href="/profile"
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 shrink-0"
          >
            <User className="w-4 h-4" />
            <span>Complete Profile</span>
          </Link>
        </div>
      )}

      {/* Multi-Document Eligibility Query Panel */}
      <Card className="p-5 flex flex-col gap-4 border-2 border-teal-500/20 bg-gradient-to-br from-teal-500/5 via-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#0D9488]" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
              {language === "ta" ? "AI தகுதி உதவி மையம்" : "AI Scheme Eligibility Assistant"}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Powered by Gemini 2.5 Flash + Official Government Scheme Vector Store
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="flex items-start gap-2 bg-teal-500/10 border border-teal-500/20 rounded-xl px-3 py-2 text-xs text-teal-800 dark:text-teal-300">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <p>
            {language === "ta"
              ? "அரசு திட்ட தகுதி குறித்து எந்த கேள்வியையும் கேளுங்கள். 'என்ன திட்டங்களுக்கு நான் தகுதியானவன்?' என்று கேட்டால் உங்கள் விவரங்களை உள்ளிட சிறு படிவம் வரும்."
              : "Ask any question about government scheme eligibility. Asking 'What schemes am I eligible for?' will prompt a quick intake form to collect your state, age, and income for accurate matching."}
          </p>
        </div>

        {/* Query Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleQuery()}
            placeholder={t.askSchemePlaceholder || "e.g., 'Am I eligible for Ayushman Vay Vandana if I am 72 years old?'"}
            className="flex-1 text-xs sm:text-sm border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#0D9488]"
          />
          <button
            onClick={() => handleQuery()}
            disabled={queryLoading || !question.trim()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {queryLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {queryLoading ? (language === "ta" ? "ஆய்வு செய்யப்படுகிறது..." : "Analyzing...") : t.checkEligibility}
          </button>
        </div>


        {/* Example Questions */}
        <div className="flex flex-wrap gap-2">
          {exampleQuestions.map((q) => (
            <button
              key={q}
              onClick={() => {
                setQuestion(q);
                handleQuery(q);
              }}
              className="text-[11px] px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-teal-500/10 hover:border-teal-500/30 transition-colors cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {queryLoading && (
          <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 rounded-xl px-4 py-3">
            <Loader2 className="w-4 h-4 animate-spin text-[#0D9488] shrink-0" />
            <span>
              {language === "ta"
                ? "அரசு காப்பீட்டு ஆவணங்களிலிருந்து தகுதிகள் மற்றும் ஆதாரங்கள் சேகரிக்கப்படுகின்றன..."
                : "Decomposing eligibility criteria and retrieving evidence from official scheme documents..."}
            </span>
          </div>
        )}
      </Card>

      {/* Query Error Alert Banner */}
      {queryError && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-red-900 dark:text-red-200">
                {queryError.title}
              </h3>
              <p className="text-xs text-red-700 dark:text-red-300 mt-0.5 max-w-2xl">
                {queryError.message}
              </p>
            </div>
          </div>
          {queryError.isRetryable && (
            <button
              onClick={retryLastQuery}
              disabled={queryLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shrink-0 cursor-pointer transition-colors disabled:opacity-50"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Retry Analysis</span>
            </button>
          )}
        </div>
      )}

      {/* Multi-Document Eligibility Result */}
      {eligibilityResult && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-base text-slate-900 dark:text-white">
              {language === "ta" ? "தகுதி ஆய்வு முடிவுகள்" : "Eligibility Assessment Result"}
            </h2>
          </div>
          <MultiDocEligibilityCard
            result={eligibilityResult}
            onContinue={activeQueryId ? handleContinueInterview : undefined}
          />
          {/* Follow-up Suggestions */}
          {followUpSuggestions.length > 0 && (
            <FollowUpSuggestions
              suggestions={followUpSuggestions}
              onSelect={(suggestion) => {
                setQuestion(suggestion);
                handleQuery(suggestion);
              }}
            />
          )}
        </div>
      )}

      {/* Past Queries History */}
      {pastQueries.length > 0 && (
        <Card className="p-4 border border-slate-200 dark:border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="font-heading font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#0D9488]" />
              <span>Your Previous Scheme Inquiries ({pastQueries.length})</span>
            </span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {pastQueries.slice(0, 5).map((pq) => (
              <button
                key={pq.query_id}
                onClick={() => {
                  if (pq.eligibility_result) {
                    setEligibilityResult(pq.eligibility_result);
                    setActiveQueryId(pq.eligibility_result.query_id || pq.query_id);
                  }
                }}
                className="w-full text-left p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors flex items-center justify-between gap-3 text-xs"
              >
                <div className="truncate">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 block truncate">
                    {pq.user_question}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {pq.created_at ? new Date(pq.created_at).toLocaleDateString() : "Recent"} • Status:{" "}
                    {pq.eligibility_result?.overall_status || "Evaluated"}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Browse Schemes Directory */}
      <div className="flex flex-col gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-heading font-bold text-lg text-slate-900 dark:text-white">
              {language === "ta" ? "அனைத்து அரசு சுகாதார திட்டங்களும்" : "Browse All Government Schemes"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === "ta" ? "பிரிவுகளின் படி வடிகட்டவும் அல்லது தேடவும்" : "Filter by category or search by health benefits and eligibility criteria"}
            </p>
          </div>

          <div className="w-full sm:w-72">
            <SchemeSearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
        </div>

        <SchemeFilterChips
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <Spinner size="lg" color="primary" />
            <span className="text-xs text-slate-500 mt-2">Loading scheme directory from official repository...</span>
          </div>
        ) : (
          <SchemeList
            schemes={schemes}
            onResetFilters={() => {
              setSelectedCategory("All");
              setSearchQuery("");
            }}
          />
        )}
      </div>
    </div>
  );
}
