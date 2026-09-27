"use client";

import React, { useState, useEffect } from "react";
import { GovernmentScheme, SchemeQuery, MultiDocEligibilityResult } from "@/types/scheme";
import { schemeApi } from "@/lib/schemeApi";
import { MultiDocEligibilityCard } from "@/components/schemes/MultiDocEligibilityCard";
import { SchemeFilterChips } from "@/components/schemes/SchemeFilterChips";
import { SchemeSearchBar } from "@/components/schemes/SchemeSearchBar";
import { SchemeList } from "@/components/schemes/SchemeList";
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
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

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

  // Past queries history
  const [pastQueries, setPastQueries] = useState<SchemeQuery[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchSchemes = async () => {
    setLoading(true);
    try {
      const data = await schemeApi.getSchemes(selectedCategory, searchQuery);
      setSchemes(data);
    } catch (err) {
      console.error("Failed to load schemes", err);
    } finally {
      setLoading(false);
    }
  };

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
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    loadHistory();
  }, []);

  const handleQuery = async (customQ?: string) => {
    const text = (customQ || question).trim();
    if (!text) return;

    setQueryLoading(true);
    setEligibilityResult(null);
    try {
      const { eligibilityResult: result } = await schemeApi.querySchemeEligibility(text);
      setEligibilityResult(result);
      loadHistory();
    } catch (err: any) {
      console.error("Eligibility query failed:", err);
      const detail = err?.response?.data?.detail || err?.message || "Please check your network and query and try again.";
      alert(`Eligibility Analysis: ${detail}`);
    } finally {
      setQueryLoading(false);
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
              ? "அரசு திட்ட தகுதி குறித்து எந்த கேள்வியையும் கேளுங்கள். AI உங்கள் கேள்வியை தனிப்பட்ட தகுதிகளாக பிரித்து அதிகாரப்பூர்வ ஆவணங்களிலிருந்து ஆதாரங்களை வழங்கும்."
              : "Ask any question about government scheme eligibility. The system decomposes your query into criteria, retrieves official evidence, compares your patient profile, and provides traceable source citations."}
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

      {/* Multi-Document Eligibility Result */}
      {eligibilityResult && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-base text-slate-900 dark:text-white">
              {language === "ta" ? "தகுதி ஆய்வு முடிவுகள்" : "Eligibility Assessment Result"}
            </h2>
            <Link
              href="/documents"
              className="flex items-center gap-1 text-xs font-semibold text-[#0D9488] hover:underline"
            >
              <FileText className="w-3.5 h-3.5" />
              {t.uploadDocuments}
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <MultiDocEligibilityCard result={eligibilityResult} />
        </div>
      )}

      {/* Past Queries History (if available) */}
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
                  }
                }}
                className="w-full text-left p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors flex items-center justify-between gap-3 text-xs"
              >
                <div className="truncate">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 block truncate">
                    {pq.user_question}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {pq.created_at ? new Date(pq.created_at).toLocaleDateString() : "Recent"} • Status: {pq.eligibility_result?.overall_status || "Evaluated"}
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
