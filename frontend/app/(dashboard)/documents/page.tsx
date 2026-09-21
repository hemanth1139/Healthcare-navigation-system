"use client";

import React from "react";
import { SchemeDocumentUpload } from "@/components/documents/SchemeDocumentUpload";
import { Card } from "@/components/ui/Card";
import {
  FolderUp,
  Info,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function SchemeDocumentsPage() {
  const { t, language } = useLanguage();

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto py-2">
      {/* Page Header */}
      <div className="border-b border-[#F0FDFA] pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-slate-700 text-white flex items-center justify-center">
            <FolderUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
              {t.uploadSchemeDocTitle}
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1">
              {t.uploadSchemeDocSub}
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="border border-teal-100 bg-teal-50/40 p-4 flex flex-col gap-3">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-teal-800 mb-1">
              {language === "ta" ? "ஆவணங்களைப் பதிவேற்றுவது ஏன் முக்கியம்?" : "Why Upload Documents?"}
            </p>
            <p className="text-xs text-teal-700 leading-relaxed">
              {language === "ta"
                ? "பிரதான் மந்திரி ஜன ஆரோக்கிய யோஜனா (PM-JAY), முதலமைச்சரின் விரிவான மருத்துவக் காப்பீட்டுத் திட்டம் போன்ற அரசு திட்டங்களுக்கு தகுதி ஆவணங்கள் தேவைப்படுகின்றன. உங்கள் வருமானச் சான்றிதழ், ஆதார் கார்டு, ரேஷன் கார்டு போன்றவற்றை இங்கே பதிவேற்றவும்."
                : "Some government healthcare schemes (like PM-JAY, CMCHIS, or state-specific schemes) require supporting documents for eligibility verification. Upload your Income Certificate, Aadhaar Card, Ration Card, or other required documents here to support your scheme eligibility assessment."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-teal-100">
          {[
            language === "ta" ? "வருமானச் சான்றிதழ்" : "Income Certificate",
            language === "ta" ? "ஆதார் கார்டு" : "Aadhaar Card",
            language === "ta" ? "குடும்ப அட்டை (Ration)" : "Ration Card",
            language === "ta" ? "சாதிச் சான்றிதழ்" : "Caste Certificate",
          ].map((doc) => (
            <div
              key={doc}
              className="flex items-center gap-1.5 text-[11px] font-medium text-teal-700 bg-white/70 border border-teal-100 rounded-lg px-2 py-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
              {doc}
            </div>
          ))}
        </div>
      </Card>

      {/* Document Upload Component */}
      <SchemeDocumentUpload />

      {/* Link to Scheme Eligibility */}
      <Card className="p-4 flex items-center justify-between border border-purple-100 bg-purple-50/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-100 border border-purple-200 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{t.checkEligibility}</p>
            <p className="text-xs text-slate-500">
              {language === "ta" ? "பதிவேற்றிய ஆவணங்கள் மூலம் AI RAG உதவிமையத்தில் தகுதியை சரிபார்க்கவும்" : "Use the AI RAG assistant to assess your eligibility with uploaded documents"}
            </p>
          </div>
        </div>
        <Link
          href="/schemes"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors shrink-0"
        >
          {language === "ta" ? "திட்டங்களுக்குச் செல்லவும்" : "Go to Schemes"}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </Card>
    </div>
  );
}
