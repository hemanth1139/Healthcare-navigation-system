"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { GovernmentScheme, SchemeQuery } from "@/types/scheme";
import { schemeApi } from "@/lib/mockSchemeData";
import { SchemeQueryPanel } from "@/components/schemes/SchemeQueryPanel";
import { EligibilityResultCard } from "@/components/schemes/EligibilityResultCard";
import { Spinner } from "@/components/ui/Spinner";
import { Card } from "@/components/ui/Card";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Gift,
} from "lucide-react";

export default function SchemeDetailPage() {
  const params = useParams();
  const schemeId = params?.schemeId as string;

  const [scheme, setScheme] = useState<GovernmentScheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [queryResult, setQueryResult] = useState<SchemeQuery | null>(null);

  useEffect(() => {
    const fetchScheme = async () => {
      setLoading(true);
      try {
        const data = await schemeApi.getSchemeById(schemeId);
        setScheme(data);
      } catch (err) {
        console.error("Failed to load scheme details", err);
      } finally {
        setLoading(false);
      }
    };

    fetchScheme();
  }, [schemeId]);

  if (loading || !scheme) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[350px]">
        <Spinner size="lg" color="primary" />
        <span className="text-xs text-[#5C6B6E] mt-2">Loading official scheme details...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto py-2">
      {/* Header back link */}
      <div className="flex items-center gap-2 border-b border-[#E6F4F3] pb-3">
        <Link
          href="/schemes"
          className="inline-flex items-center text-xs font-semibold text-[#0F6E7A] hover:underline focus-ring rounded p-1 -ml-1 gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Government Schemes Directory
        </Link>
      </div>

      {/* Scheme Title Header Card */}
      <Card className="p-6 sm:p-8 border-2 border-[#E6F4F3] shadow-clinical-lg flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F6E7A] bg-[#E6F4F3] px-3 py-1 rounded-full w-fit">
              {scheme.category || "Government Healthcare Scheme"}
            </span>

            <h1 className="font-heading font-bold text-2xl sm:text-3xl text-[#1E2A2E] leading-tight">
              {scheme.scheme_name}
            </h1>

            <p className="text-xs sm:text-sm text-[#5C6B6E] font-medium">
              {scheme.department}
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
            <span className="text-xs font-mono text-[#5C6B6E] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#0F6E7A]" /> Updated {scheme.last_updated}
            </span>

            <a
              href={scheme.official_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Visit official government website for ${scheme.scheme_name}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F6E7A] bg-[#E6F4F3] hover:bg-[#E6F4F3]/80 px-3.5 py-1.5 rounded-xl border border-[#0F6E7A]/20 transition-colors focus-ring"
            >
              <span>Official Government Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {scheme.coverage_amount && (
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#0F6E7A] bg-[#E6F4F3]/80 px-3 py-1.5 rounded-xl border border-[#0F6E7A]/20 w-fit mt-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Coverage Cap: {scheme.coverage_amount}</span>
          </div>
        )}
      </Card>

      {/* Two Main Content Sections: Eligibility & Benefits (Readable ~65ch line length) */}
      <div className="grid grid-cols-1 gap-6 max-w-prose mx-auto w-full">
        {/* Section 1: Eligibility Guidelines */}
        <Card className="p-6 border-2 border-[#E6F4F3] flex flex-col gap-3">
          <h2 className="font-heading font-bold text-lg text-[#1E2A2E] flex items-center gap-2 border-b border-[#E6F4F3] pb-2">
            <CheckCircle2 className="w-5 h-5 text-[#0F6E7A]" />
            Official Eligibility Criteria
          </h2>

          <p className="text-xs sm:text-sm text-[#1E2A2E] leading-relaxed whitespace-pre-wrap font-body">
            {scheme.eligibility}
          </p>
        </Card>

        {/* Section 2: Scheme Benefits */}
        <Card className="p-6 border-2 border-[#E6F4F3] flex flex-col gap-3">
          <h2 className="font-heading font-bold text-lg text-[#1E2A2E] flex items-center gap-2 border-b border-[#E6F4F3] pb-2">
            <Gift className="w-5 h-5 text-[#0F6E7A]" />
            Coverage & Hospital Benefits
          </h2>

          <p className="text-xs sm:text-sm text-[#1E2A2E] leading-relaxed whitespace-pre-wrap font-body">
            {scheme.benefits}
          </p>
        </Card>
      </div>

      {/* Bottom Action: Scoped Query Panel for this specific scheme */}
      <div className="flex flex-col gap-4 pt-4 border-t border-[#E6F4F3]">
        <h2 className="font-heading font-bold text-lg text-[#1E2A2E]">
          Ask About Your Eligibility For This Scheme
        </h2>

        <SchemeQueryPanel
          scopedSchemeId={scheme.scheme_id}
          placeholder={`Ask if your family status or income qualifies for ${scheme.scheme_name}...`}
          onQueryResult={(res) => setQueryResult(res)}
        />

        {queryResult && <EligibilityResultCard result={queryResult} />}
      </div>
    </div>
  );
}
