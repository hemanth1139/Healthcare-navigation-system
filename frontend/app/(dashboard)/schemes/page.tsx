"use client";

import React, { useState, useEffect } from "react";
import { GovernmentScheme } from "@/types/scheme";
import { MultiDocEligibilityResult } from "@/types/scheme";
import { schemeApi } from "@/lib/mockSchemeData";
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
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function SchemesLandingPage() {
  const [schemes, setSchemes] = useState<GovernmentScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const { t, language } = useLanguage();

  // Phase 1: Multi-doc eligibility RAG state
  const [question, setQuestion] = useState("");
  const [queryLoading, setQueryLoading] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState<MultiDocEligibilityResult | null>(null);

  useEffect(() => {
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

    fetchSchemes();
  }, [selectedCategory, searchQuery]);

  const handleQuery = async () => {
    if (!question.trim()) return;
    setQueryLoading(true);
    setEligibilityResult(null);
    try {
      const { eligibilityResult: result } = await schemeApi.querySchemeEligibility(question);
      setEligibilityResult(result);
    } catch (err) {
      console.error("Eligibility query failed", err);
    } finally {
      setQueryLoading(false);
    }
  };

  const exampleQuestions = language === "ta" ? [
    "எனக்கு 72 வயதாக இருந்தால் ஆயுஷ்மான் வய வந்தனா திட்டத்திற்கு தகுதி உண்டா?",
    "பிஎம்-ஜேஏஒய் (PM-JAY) திட்டத்தின் கீழ் அழகு சாதன சிகிச்சை சேர்க்கப்பட்டுள்ளதா?",
    "பிஎம்-ஜேஏஒய் திட்டத்திற்கு நான் தகுதியானவனா?",
  ] : [
    "Am I eligible for Ayushman Vaya Vandana if I am 72 years old?",
    "Is cosmetic surgery covered under PM-JAY?",
    "Am I eligible for Ayushman Bharat PM-JAY?",
  ];

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto py-2">
      {/* Page Header */}
      <div className="border-b border-[#E6F4F3] pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#1E2A2E] tracking-tight">
              {t.schemeTitle}
            </h1>
            <p className="text-xs sm:text-sm text-[#5C6B6E] mt-1">
              {t.schemeSubtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Phase 1: Multi-Document Eligibility Query Panel */}
      <Card className="p-5 flex flex-col gap-4 border-2 border-purple-100 bg-gradient-to-br from-purple-50/30 to-white">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-100 border border-purple-200 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-sm text-slate-900">
              {language === "ta" ? "AI தகுதி உதவி மையம்" : "AI Eligibility Assistant"}
            </h2>
            <p className="text-[11px] text-slate-500">
              Powered by Gemini 2.5 Flash + ChromaDB RAG pipeline
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="flex items-start gap-2 bg-purple-50 border border-purple-100 rounded-xl px-3 py-2 text-xs text-purple-700">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <p>
            {language === "ta"
              ? "அரசு திட்ட தகுதி குறித்து எந்த கேள்வியையும் கேளுங்கள். AI உங்கள் கேள்வியை தனிப்பட்ட தகுதிகளாக பிரித்து அதிகாரப்பூர்வ ஆவணங்களிலிருந்து ஆதாரங்களை வழங்கும்."
              : "Ask any question about government scheme eligibility. The AI will decompose your query into individual criteria, retrieve evidence from official documents, and provide a criterion-level eligibility breakdown with source citations."}
          </p>
        </div>

        {/* Query Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleQuery()}
            placeholder={t.askSchemePlaceholder}
            className="flex-1 text-sm border border-slate-200 rounded-xl px-4 py-2.5 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <button
            onClick={handleQuery}
            disabled={queryLoading || !question.trim()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              onClick={() => setQuestion(q)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {queryLoading && (
          <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3">
            <Loader2 className="w-4 h-4 animate-spin text-purple-600 shrink-0" />
            <span>
              {language === "ta"
                ? "அரசு காப்பீட்டு ஆவணங்களிலிருந்து தகுதிகள் மற்றும் ஆதாரங்கள் சேகரிக்கப்படுகின்றன..."
                : "Decomposing eligibility criteria and retrieving evidence from official scheme documents..."}
            </span>
          </div>
        )}
      </Card>

      {/* Phase 1: Multi-Document Eligibility Result */}
      {eligibilityResult && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-base text-slate-900">
              {language === "ta" ? "தகுதி ஆய்வு முடிவுகள்" : "Eligibility Assessment Result"}
            </h2>
            <div className="flex items-center gap-2">
              <Link
                href="/documents"
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
              >
                <FileText className="w-3.5 h-3.5" />
                {t.uploadDocuments}
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
          <MultiDocEligibilityCard result={eligibilityResult} />
        </div>
      )}

      {/* Browse Schemes Directory */}
      <div className="flex flex-col gap-4 pt-4 border-t border-[#E6F4F3]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-heading font-bold text-lg text-[#1E2A2E]">
              {language === "ta" ? "அனைத்து அரசு சுகாதார திட்டங்களும்" : "Browse All Government Schemes"}
            </h2>
            <p className="text-xs text-[#5C6B6E]">
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
            <span className="text-xs text-[#5C6B6E] mt-2">Loading scheme directory...</span>
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
