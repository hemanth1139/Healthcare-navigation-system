"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, Download, ExternalLink, Lock } from "lucide-react";

export const PrivacyDataSection: React.FC = () => {
  const [downloadToast, setDownloadToast] = useState(false);

  const handleDownloadData = () => {
    setDownloadToast(true);
    setTimeout(() => setDownloadToast(false), 3000);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* PII Trust Explanation Card */}
      <div className="bg-[#E6F4F3]/60 dark:bg-[#0F6E7A]/15 border border-[#0F6E7A]/20 rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#0F6E7A] dark:text-[#25A0B0]" />
          <h3 className="font-heading font-bold text-sm text-[#1E2A2E] dark:text-[#F7FAFA]">
            Automated PII Privacy Protection & Encryption
          </h3>
        </div>

        <p className="text-xs text-[#5C6B6E] dark:text-[#A3B2B5] leading-relaxed">
          HealthCare Navigator processes all uploaded medical documents, prescriptions, and symptom chat logs through Microsoft Presidio PII redaction. Personally identifiable information (name, Aadhaar, contact details) is stripped before any clinical triage or RAG indexing occurs.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <Button
          onClick={handleDownloadData}
          variant="secondary"
          size="md"
          className="w-full sm:w-auto"
        >
          <Download className="w-4 h-4 mr-1.5" />
          Download My Complete Health Data (JSON/PDF)
        </Button>

        <Link
          href="/privacy"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F6E7A] dark:text-[#25A0B0] hover:underline focus-ring rounded p-1"
        >
          <span>Read Privacy Policy & Data Terms</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {downloadToast && (
        <div
          role="region"
          aria-live="polite"
          className="bg-[#0F6E7A] text-white p-3 rounded-xl text-xs font-semibold shadow-clinical flex items-center gap-2 animate-in fade-in"
        >
          <Lock className="w-4 h-4 text-white shrink-0" />
          <span>Your encrypted health data export request has been queued. An export link will be sent to your email.</span>
        </div>
      )}
    </div>
  );
};
