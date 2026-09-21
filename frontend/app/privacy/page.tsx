import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, FileText, Database } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] text-[#0F172A] dark:text-[#F8FAFC] p-4 sm:p-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D9488] dark:text-[#14B8A6] hover:underline w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Settings
        </Link>

        <div className="border-b border-[#F0FDFA] dark:border-[#1E293B] pb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#0D9488] dark:text-[#14B8A6]" />
            <h1 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight">
              Privacy Policy & Data Security
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">
            How HealthCare Navigator redacts PII and protects your clinical data
          </p>
        </div>

        <Card className="p-6 sm:p-8 flex flex-col gap-6 bg-white dark:bg-[#0F172A] border-2 border-[#F0FDFA] dark:border-[#1E293B] shadow-xs">
          <section className="flex flex-col gap-2">
            <h2 className="font-heading font-bold text-base text-[#0D9488] dark:text-[#14B8A6] flex items-center gap-2">
              <Lock className="w-4 h-4" /> 1. Automated PII Redaction (Microsoft Presidio)
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
              Before any medical document, prescription image, or symptom text is processed by our machine learning differential models or RAG vector databases, all Personally Identifiable Information (PII) including full patient names, contact numbers, Aadhaar numbers, and residential street addresses are automatically detected and redacted.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="font-heading font-bold text-base text-[#0D9488] dark:text-[#14B8A6] flex items-center gap-2">
              <Database className="w-4 h-4" /> 2. HL7 FHIR Interoperability
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
              All clinical records uploaded to your vault are formatted according to international HL7 FHIR (Fast Healthcare Interoperability Resources) specifications (`DiagnosticReport`, `MedicationRequest`, `Observation`). This ensures your health records remain structured, portable, and strictly owned by you.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="font-heading font-bold text-base text-[#0D9488] dark:text-[#14B8A6] flex items-center gap-2">
              <FileText className="w-4 h-4" /> 3. Data Ownership & Export Rights
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
              You retain 100% ownership of your data. You may request a complete export of your health history, active prescriptions, and uploaded files in standardized format at any time, or permanently delete your account using our friction-gated deletion workflow.
            </p>
          </section>
        </Card>
      </div>
    </div>
  );
}
