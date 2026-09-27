"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { GovernmentScheme, SchemeQuery } from "@/types/scheme";
import { schemeApi } from "@/lib/schemeApi";
import { SchemeQueryPanel } from "@/components/schemes/SchemeQueryPanel";
import { MultiDocEligibilityCard } from "@/components/schemes/MultiDocEligibilityCard";
import { Spinner } from "@/components/ui/Spinner";
import { Card } from "@/components/ui/Card";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Gift,
  FileCheck,
  AlertTriangle,
  Building2,
  UserCheck,
  FileText,
  XCircle,
} from "lucide-react";

export default function SchemeDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [scheme, setScheme] = useState<GovernmentScheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [queryResult, setQueryResult] = useState<SchemeQuery | null>(null);

  useEffect(() => {
    const fetchScheme = async () => {
      setLoading(true);
      try {
        const data = await schemeApi.getSchemeById(id);
        setScheme(data);
      } catch (err) {
        console.error("Failed to load scheme details", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchScheme();
    }
  }, [id]);

  if (loading || !scheme) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[350px]">
        <Spinner size="lg" color="primary" />
        <span className="text-xs text-slate-500 mt-2">Loading official scheme details...</span>
      </div>
    );
  }

  const eligCriteria = scheme.eligibility_criteria || {};
  const reqDocs = eligCriteria.required_documents || [];
  const coveredConds = scheme.key_covered_conditions || [];
  const exclusions = scheme.key_exclusions || [];

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto py-2">
      {/* Header back link */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <Link
          href="/schemes"
          className="inline-flex items-center text-xs font-semibold text-[#0D9488] dark:text-[#14B8A6] hover:underline p-1 -ml-1 gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Government Schemes Directory
        </Link>

        <Link
          href={`/schemes/${id}/eligibility`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold shadow-md transition-colors"
        >
          <FileCheck className="w-4 h-4" />
          Evaluate My Eligibility
        </Link>
      </div>

      {/* Scheme Title Header Card */}
      <Card className="p-6 sm:p-8 border-2 border-teal-500/20 bg-gradient-to-br from-white via-slate-50 to-teal-500/5 dark:from-slate-900 dark:to-slate-950 shadow-md flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0D9488] dark:text-[#14B8A6] bg-teal-500/10 px-3 py-1 rounded-full w-fit">
                {scheme.category || "Government Healthcare Scheme"}
              </span>
              {scheme.state && (
                <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                  {scheme.state}
                </span>
              )}
              {scheme.cashless && (
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  Cashless Hospitalization
                </span>
              )}
            </div>

            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white leading-tight">
              {scheme.scheme_name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
              {scheme.department}
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#0D9488]" /> Updated {scheme.last_updated}
            </span>

            {scheme.official_url && (
              <a
                href={scheme.official_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D9488] dark:text-[#14B8A6] bg-teal-500/10 hover:bg-teal-500/20 px-3.5 py-1.5 rounded-xl border border-teal-500/20 transition-colors"
              >
                <span>Official Government Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {scheme.coverage_amount && (
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#0D9488] dark:text-[#14B8A6] bg-teal-500/10 px-3.5 py-1.5 rounded-xl border border-teal-500/20 w-fit mt-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Coverage Cap: {scheme.coverage_amount}</span>
          </div>
        )}
      </Card>

      {/* Structured Eligibility & Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Eligibility Criteria Card */}
        <Card className="p-6 border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
          <h2 className="font-heading font-bold text-base text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <UserCheck className="w-4 h-4 text-[#0D9488]" />
            Eligibility Requirements
          </h2>

          <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
            {eligCriteria.target_beneficiaries && (
              <div>
                <span className="font-semibold text-slate-900 dark:text-slate-100 block">Target Beneficiaries:</span>
                <p className="text-slate-600 dark:text-slate-400 mt-0.5">{eligCriteria.target_beneficiaries}</p>
              </div>
            )}
            {eligCriteria.age_group && (
              <div>
                <span className="font-semibold text-slate-900 dark:text-slate-100 block">Age Group:</span>
                <p className="text-slate-600 dark:text-slate-400 mt-0.5">{eligCriteria.age_group}</p>
              </div>
            )}
            {eligCriteria.income_limit_per_annum_inr && (
              <div>
                <span className="font-semibold text-slate-900 dark:text-slate-100 block">Income Limit:</span>
                <p className="text-slate-600 dark:text-slate-400 mt-0.5">{eligCriteria.income_limit_per_annum_inr}</p>
              </div>
            )}
            {eligCriteria.bpl_or_secc_required && (
              <div>
                <span className="font-semibold text-slate-900 dark:text-slate-100 block">BPL / SECC Required:</span>
                <p className="text-slate-600 dark:text-slate-400 mt-0.5">{eligCriteria.bpl_or_secc_required}</p>
              </div>
            )}
            {!eligCriteria.target_beneficiaries && (
              <p className="leading-relaxed">{scheme.eligibility}</p>
            )}
          </div>

          {reqDocs.length > 0 && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mb-2">
                <FileText className="w-3.5 h-3.5 text-slate-500" /> Required Documents:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {reqDocs.map((doc, i) => (
                  <span key={i} className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                    {doc}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Coverage & Benefits Card */}
        <Card className="p-6 border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
          <h2 className="font-heading font-bold text-base text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <Gift className="w-4 h-4 text-[#0D9488]" />
            Coverage & Benefits
          </h2>

          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-body">
            {scheme.benefits}
          </p>

          {coveredConds.length > 0 && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> Key Covered Treatments:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {coveredConds.map((cond, i) => (
                  <span key={i} className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/50">
                    {cond}
                  </span>
                ))}
              </div>
            </div>
          )}

          {exclusions.length > 0 && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-xs text-rose-700 dark:text-rose-400 flex items-center gap-1.5 mb-2">
                <XCircle className="w-3.5 h-3.5" /> Key Exclusions:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {exclusions.map((ex, i) => (
                  <span key={i} className="text-[11px] px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200/50">
                    {ex}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Interactive Evaluation Action */}
      <div className="flex flex-col gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold text-lg text-slate-900 dark:text-white">
            Ask AI Assistant About Your Eligibility For This Scheme
          </h2>
          <Link
            href={`/schemes/${id}/eligibility`}
            className="text-xs font-bold text-[#0D9488] hover:underline"
          >
            Open Full Evaluation Screen →
          </Link>
        </div>

        <SchemeQueryPanel
          scopedSchemeId={scheme.scheme_id}
          placeholder={`Ask if your family status or income qualifies for ${scheme.scheme_name}...`}
          onQueryResult={(res) => setQueryResult(res)}
        />

        {queryResult?.eligibility_result && (
          <MultiDocEligibilityCard result={queryResult.eligibility_result} />
        )}
      </div>
    </div>
  );
}
