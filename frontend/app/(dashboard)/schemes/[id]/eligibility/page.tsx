"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { GovernmentScheme, SchemeQuery, MultiDocEligibilityResult } from "@/types/scheme";
import { schemeApi } from "@/lib/schemeApi";
import { api } from "@/lib/api";
import { MultiDocEligibilityCard } from "@/components/schemes/MultiDocEligibilityCard";
import { Spinner } from "@/components/ui/Spinner";
import { Card } from "@/components/ui/Card";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  FileText,
  ExternalLink,
  Sparkles,
  ArrowLeft,
  Send,
  Loader2,
  User,
  Plus,
  RefreshCw,
} from "lucide-react";

export default function SchemeEligibilityResultPage({ params }: { params: { id: string } }) {
  const { id } = params;

  const [scheme, setScheme] = useState<GovernmentScheme | null>(null);
  const [patientProfile, setPatientProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const [question, setQuestion] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [activeQuery, setActiveQuery] = useState<SchemeQuery | null>(null);
  const [activeResult, setActiveResult] = useState<MultiDocEligibilityResult | null>(null);

  // Missing info form
  const [missingInputs, setMissingInputs] = useState<Record<string, string>>({});
  const [isSubmittingMissing, setIsSubmittingMissing] = useState(false);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [schemeData, profileRes] = await Promise.allSettled([
          schemeApi.getSchemeById(id),
          api.get("/profile"),
        ]);

        if (schemeData.status === "fulfilled" && schemeData.value) {
          setScheme(schemeData.value);
        }
        if (profileRes.status === "fulfilled" && profileRes.value?.data) {
          setPatientProfile(profileRes.value.data);
        }
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      init();
    }
  }, [id]);

  const handleEvaluate = async (customQ?: string, additionalInfo?: Record<string, any>) => {
    const q = customQ !== undefined ? customQ : question;
    setEvaluating(true);
    try {
      const { query, eligibilityResult } = await schemeApi.evaluateScopedEligibility(
        id,
        q.trim() || undefined,
        additionalInfo
      );
      setActiveQuery(query);
      setActiveResult(eligibilityResult);
    } catch (err: any) {
      console.error("Evaluation failed:", err);
      const detail = err?.response?.data?.detail || err?.message || "Please check your network and query and try again.";
      alert(`Eligibility Evaluation: ${detail}`);
    } finally {
      setEvaluating(false);
    }
  };

  const handleContinueMissing = async (directInputs?: Record<string, string>) => {
    if (!activeQuery?.query_id || isSubmittingMissing) return;

    const payloadInputs = directInputs || missingInputs;
    setIsSubmittingMissing(true);
    try {
      const { query, eligibilityResult } = await schemeApi.continueEligibility(
        activeQuery.query_id,
        payloadInputs
      );
      setActiveQuery(query);
      setActiveResult(eligibilityResult);
      setMissingInputs({});
    } catch (err) {
      console.error("Continuation failed:", err);
      alert("Failed to submit additional information. Please retry.");
    } finally {
      setIsSubmittingMissing(false);
    }
  };

  if (loading || !scheme) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <Spinner size="lg" color="primary" />
        <span className="text-xs text-slate-500 mt-2">Loading official scheme & profile context...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <Link
          href={`/schemes/${id}`}
          className="inline-flex items-center text-xs font-semibold text-[#0D9488] dark:text-[#14B8A6] hover:underline gap-1 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to {scheme.scheme_name}</span>
        </Link>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          RAG Scheme Eligibility Evaluation
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Decomposes eligibility requirements from official government documents, evaluates your patient profile, and grounds decisions with traceable source citations.
        </p>
      </div>

      {/* Patient Profile Context Badge Card */}
      <Card className="p-4 bg-teal-50/40 dark:bg-teal-950/20 border border-teal-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0D9488] text-white flex items-center justify-center shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0D9488] dark:text-[#14B8A6]">
              Active Patient Profile Baseline
            </span>
            <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs font-medium text-slate-700 dark:text-slate-300">
              {patientProfile?.gender && <span>Gender: {patientProfile.gender}</span>}
              {patientProfile?.state && <span>• State: {patientProfile.state}</span>}
              {patientProfile?.city && <span>• City: {patientProfile.city}</span>}
              {patientProfile?.dateOfBirth && (
                <span>• DOB: {new Date(patientProfile.dateOfBirth).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => handleEvaluate(question || `Evaluate my eligibility for ${scheme.scheme_name}`)}
          disabled={evaluating}
          className="px-4 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 shrink-0"
        >
          {evaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>1-Click Auto Evaluate</span>
        </button>
      </Card>

      {/* Natural Language Eligibility Query Input */}
      <Card className="p-5 border-2 border-teal-500/20 flex flex-col gap-3">
        <label className="font-heading font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-[#0D9488]" />
          <span>Ask a Specific Eligibility Question (Optional):</span>
        </label>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEvaluate()}
            placeholder={`e.g. 'I am 70+ years old and need heart surgery. Am I covered under ${scheme.scheme_name}?'`}
            className="flex-1 text-xs sm:text-sm border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#0D9488]"
          />
          <button
            onClick={() => handleEvaluate()}
            disabled={evaluating}
            className="px-4 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
          >
            {evaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Evaluate</span>
          </button>
        </div>
      </Card>

      {/* Evaluating Progress Indicator */}
      {evaluating && (
        <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
          <Loader2 className="w-5 h-5 animate-spin text-[#0D9488] shrink-0" />
          <span>
            Retrieving official guidelines, decomposing criteria, and verifying patient profile against scheme rules...
          </span>
        </div>
      )}

      {/* Multi-Document Evidence-Grounded Result */}
      {activeResult && !evaluating && (
        <div className="flex flex-col gap-6">
          {/* Conversational MCQ Interview State */}
          {activeResult.interview_state === "QUESTIONS_REQUIRED" && activeResult.current_question ? (
            <Card className="p-6 border-2 border-teal-500/30 bg-teal-50/20 dark:bg-slate-900/80 flex flex-col gap-5 shadow-md">
              {/* Progress & Header */}
              <div className="flex items-center justify-between gap-4 pb-3 border-b border-teal-500/20">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                    {activeResult.progress?.answered !== undefined ? activeResult.progress.answered + 1 : 1}
                  </span>
                  <div>
                    <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-slate-100">
                      Eligibility Assessment Interview
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Question {activeResult.progress?.answered !== undefined ? activeResult.progress.answered + 1 : 1} of{" "}
                      {activeResult.progress?.total_required || 2}
                    </p>
                  </div>
                </div>

                {activeResult.progress && (
                  <div className="w-32 sm:w-48 flex flex-col gap-1">
                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-600 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.round(
                            (activeResult.progress.answered / activeResult.progress.total_required) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* AI Dialogue prompt */}
              <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-teal-500/20 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-700 dark:text-teal-400">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Eligibility Assistant</span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {activeResult.current_question.question}
                </p>
              </div>

              {/* MCQ Options or Input field */}
              {activeResult.current_question.options && activeResult.current_question.options.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeResult.current_question.options.map((option, idx) => {
                    const fKey = activeResult.current_question?.field_key || (activeResult.current_question as any)?.fieldKey || activeResult.current_question?.criterion_id || "additional_info";
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          handleContinueMissing({ [fKey]: option });
                        }}
                        disabled={isSubmittingMissing}
                        className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-400 bg-white dark:bg-slate-900 hover:bg-teal-50/50 dark:hover:bg-teal-950/30 text-left transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-teal-700 dark:group-hover:text-teal-300">
                          {option}
                        </span>
                        <span className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:border-teal-500 group-hover:text-teal-600 shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                (() => {
                  const fKey = activeResult.current_question?.field_key || (activeResult.current_question as any)?.fieldKey || activeResult.current_question?.criterion_id || "additional_info";
                  return (
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        placeholder="Provide your answer..."
                        value={missingInputs[fKey] || ""}
                        onChange={(e) =>
                          setMissingInputs((prev) => ({
                            ...prev,
                            [fKey]: e.target.value,
                          }))
                        }
                        className="w-full text-xs sm:text-sm border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                      />
                      <button
                        onClick={() => handleContinueMissing(missingInputs)}
                        disabled={isSubmittingMissing || !missingInputs[fKey]?.trim()}
                        className="self-end px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-all"
                      >
                        Submit Answer
                      </button>
                    </div>
                  );
                })()
              )}

              {/* Privacy note */}
              <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span>Privacy First: Answers are only evaluated for this query session.</span>
              </div>
            </Card>
          ) : (
            /* Completed Assessment View */
            <MultiDocEligibilityCard result={activeResult} />
          )}
        </div>
      )}
    </div>
  );
}
