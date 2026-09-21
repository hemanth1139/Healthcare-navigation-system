"use client";

import React, { useState, useEffect } from "react";
import { Conversation } from "@/types/chat";
import { mockChatApi } from "@/lib/mockChatData";
import { ConversationStartCard } from "@/components/chat/ConversationStartCard";
import { PatientContextBanner } from "@/components/context/PatientContextBanner";
import { Spinner } from "@/components/ui/Spinner";
import { Info, Stethoscope } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

// Mock patient context (in real app, fetched from backend)
const MOCK_PATIENT_CONTEXT = {
  patientName: "Ravi Kumar",
  age: 45,
  gender: "Male",
  allergies: ["Penicillin", "Sulfa drugs"],
  medications: ["Metformin 500mg", "Atorvastatin 20mg"],
  conditions: ["Type 2 Diabetes", "Hypertension"],
  relevantConsultationCount: 2,
};

export default function SymptomChatPage() {
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const checkActive = async () => {
      try {
        const recent = await mockChatApi.getRecentConversation();
        setActiveConv(recent);
      } catch (err) {
        console.error("Failed to fetch active conversation", err);
      } finally {
        setLoading(false);
      }
    };

    checkActive();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[300px]">
        <Spinner size="lg" color="primary" />
        <span className="text-xs text-[#64748B] mt-2">
          Preparing AI symptom intake session...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 py-2 max-w-3xl mx-auto">
      {/* Page Header */}
      <div className="border-b border-[#F0FDFA] pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-[#0F172A] tracking-tight">
              {t.symptomChatTitle}
            </h1>
            <p className="text-xs text-[#64748B]">
              {t.symptomChatSubtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Patient Context Banner — shown when patient profile exists */}
      <PatientContextBanner
        patientName={MOCK_PATIENT_CONTEXT.patientName}
        age={MOCK_PATIENT_CONTEXT.age}
        gender={MOCK_PATIENT_CONTEXT.gender}
        allergies={MOCK_PATIENT_CONTEXT.allergies}
        medications={MOCK_PATIENT_CONTEXT.medications}
        conditions={MOCK_PATIENT_CONTEXT.conditions}
        relevantConsultationCount={MOCK_PATIENT_CONTEXT.relevantConsultationCount}
      />

      {/* How it works info banner */}
      <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-600">
        <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
        <p>
          <strong>{t.howItWorks}</strong> {t.howItWorksDesc}
        </p>
      </div>

      {/* Conversation Start Card */}
      <ConversationStartCard activeConversation={activeConv} />
    </div>
  );
}
