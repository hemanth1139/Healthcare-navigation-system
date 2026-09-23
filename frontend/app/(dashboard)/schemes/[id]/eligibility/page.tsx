"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Upload,
  Sparkles,
  ArrowLeft,
} from "lucide-react";

export default function SchemeEligibilityResultPage({ params }: { params: { id: string } }) {
  const [expandedCriteria, setExpandedCriteria] = useState<number | null>(0);
  const [expandedSources, setExpandedSources] = useState<boolean>(true);

  // Status can be: ELIGIBLE, NOT_ELIGIBLE, POSSIBLY_ELIGIBLE, INSUFFICIENT_INFORMATION
  const status: "ELIGIBLE" | "NOT_ELIGIBLE" | "POSSIBLY_ELIGIBLE" | "INSUFFICIENT_INFORMATION" = "ELIGIBLE";

  const schemeInfo = {
    name: "Ayushman Bharat PM-JAY (Pradhan Mantri Jan Arogya Yojana)",
    officialUrl: "https://pmjay.gov.in",
    summary: "Comprehensive health coverage of ₹5 Lakh per family per year for secondary and tertiary hospitalization care across empaneled public and private hospitals in India.",
  };

  const criteria = [
    {
      name: "Socio-Economic Caste Census (SECC 2011) / BPL Status",
      status: "PASS",
      patientVal: "D-1, D-3, D-4 Deprivation Category (Verified via Ration Card)",
      requiredVal: "Listed in SECC 2011 rural/urban deprivation categories",
      explanation: "Patient family is registered under rural deprivation criteria D-3 (Kucha walls and roof).",
      sourceDoc: "pmjay_guidelines_2024.pdf",
      page: 14,
      excerpt: "Rural households having only one room with kucha walls and kucha roof automatically qualify under PM-JAY entitlement database.",
    },
    {
      name: "Age & Household Composition",
      status: "PASS",
      patientVal: "72 years (Senior Citizen)",
      requiredVal: "No restriction on family size or age under PM-JAY / Vaya Vandana Card",
      explanation: "Ayushman Vaya Vandana addition grants top-up ₹5 Lakh coverage to senior citizens 70+ regardless of income.",
      sourceDoc: "vaya_vandana_expansion_notice.pdf",
      page: 3,
      excerpt: "All senior citizens of age 70 years and above irrespective of socio-economic status are eligible to receive Ayushman Vaya Vandana Card.",
    },
    {
      name: "Income Certificate Verification",
      status: "UNKNOWN",
      patientVal: "Missing Document",
      requiredVal: "State Income Certificate < ₹2.5 Lakh/annum for state add-on benefits",
      explanation: "State-level secondary cash-less benefit requires an updated annual income certificate.",
      sourceDoc: "tn_cmehis_rules.pdf",
      page: 22,
      excerpt: "State health insurance extension requires proof of annual household income certified by Village Administrative Officer (VAO).",
      missingInfoTag: "Income Certificate Required",
    },
  ];

  const missingInfoItems = [
    { name: "Annual Income Certificate (VAO issued)", icon: FileText },
    { name: "Aadhaar e-KYC Verification for dependents", icon: ShieldCheck },
  ];

  const evidenceSources = [
    {
      title: "PM-JAY National Health Authority Guidelines 2024",
      page: 14,
      relevance: 96,
      excerpt: "Section 4.1: Entitlement based on SECC 2011 database covers D1, D2, D3, D4, D5, D7 categories automatically across all state networks.",
      url: "https://pmjay.gov.in/guidelines",
    },
    {
      title: "Ayushman Vaya Vandana Gazette Notification",
      page: 3,
      relevance: 91,
      excerpt: "Section 2: Universal health coverage addition of ₹5 Lakh for 70+ years seniors in all PM-JAY empaneled hospitals.",
      url: "https://nha.gov.in/vaya-vandana",
    },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <Link href="/schemes" className="inline-flex items-center text-xs font-semibold text-[#0D9488] dark:text-[#14B8A6] hover:underline gap-1 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Government Schemes</span>
        </Link>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          RAG Scheme Eligibility Result
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Automated evaluation against official government health insurance guidelines.
        </p>
      </div>

      {/* SECTION 1 — Overall Status Banner */}
      <div className="card-clinical p-6 sm:p-8 bg-gradient-to-br from-white via-slate-50 to-teal-500/5 dark:from-slate-900 dark:to-slate-950 border-2 border-teal-500/20 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">Government Scheme</span>
            <h2 className="font-heading text-xl font-bold text-slate-900 dark:text-white">{schemeInfo.name}</h2>
          </div>

          {/* Status Badge */}
          <div className="shrink-0">
            {status === "ELIGIBLE" && (
              <span className="px-4 py-2 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500/30 font-heading font-extrabold text-sm flex items-center gap-2 shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>ELIGIBLE</span>
              </span>
            )}
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {schemeInfo.summary}
        </p>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Evaluation Model: Gemini 2.5 RAG Clinical Retriever</span>
          <a href={schemeInfo.officialUrl} target="_blank" rel="noreferrer" className="text-[#0D9488] dark:text-[#14B8A6] font-bold hover:underline flex items-center gap-1">
            <span>Official Scheme Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* SECTION 2 — Criteria Breakdown Table */}
      <div className="card-clinical p-6 flex flex-col gap-4">
        <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#0D9488]" />
          <span>Individual Criteria Breakdown</span>
        </h3>

        <div className="flex flex-col gap-3">
          {criteria.map((c, i) => (
            <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {c.status === "PASS" && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                  {c.status === "FAIL" && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
                  {c.status === "UNKNOWN" && <HelpCircle className="w-5 h-5 text-amber-500 shrink-0" />}

                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{c.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  {c.missingInfoTag && (
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      {c.missingInfoTag}
                    </span>
                  )}
                  <button
                    onClick={() => setExpandedCriteria(expandedCriteria === i ? null : i)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {expandedCriteria === i ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Side-by-side Patient vs Required Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Patient Record Value</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{c.patientVal}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Scheme Requirement</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{c.requiredVal}</span>
                </div>
              </div>

              {/* Expandable Supporting Evidence Excerpt */}
              {expandedCriteria === i && (
                <div className="mt-1 p-3 rounded-xl bg-teal-500/5 border border-teal-500/20 text-xs flex flex-col gap-1.5 animate-in fade-in">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#0D9488] dark:text-[#14B8A6]">
                    <span>Source Document: {c.sourceDoc} (Page {c.page})</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 italic leading-relaxed">
                    &ldquo;{c.excerpt}&rdquo;
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3 — Missing Information Alert Box */}
      <div className="card-clinical p-6 bg-amber-500/10 border-2 border-amber-500/30 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-amber-800 dark:text-amber-300">
              Required Documents for 100% Cashless Approval
            </h3>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Please upload the following missing document certificates to complete scheme registration:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {missingInfoItems.map((item, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <item.icon className="w-4 h-4 text-amber-600" />
                <span>{item.name}</span>
              </div>
              <Link href="/documents" className="px-3 py-1 rounded-lg bg-[#0D9488] text-white text-[11px] font-bold hover:bg-[#0F766E] transition-colors flex items-center gap-1">
                <Upload className="w-3 h-3" />
                <span>Upload</span>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4 — AI Explanation */}
      <div className="card-clinical p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#0D9488]" />
            <span>AI Eligibility Reasoning Breakdown</span>
          </h3>
          <span className="text-xs font-mono font-bold text-[#0D9488]">RAG Score: 96%</span>
        </div>

        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3">
          <p>
            Based on the multi-document grounding of official NHA guidelines, the patient qualifies for <strong>100% cashless treatment up to ₹5,00,000/year</strong>.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Primary entitlement confirmed via SECC 2011 rural kucha household census.</li>
            <li>Senior citizen universal top-up confirmed via Ayushman Vaya Vandana amendment.</li>
            <li>Pre-existing conditions (Type 2 Diabetes, Hypertension) covered from Day 1 with zero waiting period.</li>
          </ul>
        </div>
      </div>

      {/* SECTION 5 — Evidence Sources Dropdown */}
      <div className="card-clinical p-6 flex flex-col gap-4">
        <button
          onClick={() => setExpandedSources(!expandedSources)}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#0D9488]" />
            <span>Retrieved Document Chunks & Source Verification ({evidenceSources.length})</span>
          </h3>
          {expandedSources ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {expandedSources && (
          <div className="flex flex-col gap-3 pt-2">
            {evidenceSources.map((src, i) => (
              <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{src.title} (Page {src.page})</span>
                  <a href={src.url} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-[#0D9488] hover:underline flex items-center gap-1">
                    <span>Source PDF</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span>Relevance:</span>
                  <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-[#0D9488]" style={{ width: `${src.relevance}%` }} />
                  </div>
                  <span className="font-mono font-bold text-[#0D9488]">{src.relevance}%</span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  &ldquo;{src.excerpt}&rdquo;
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
