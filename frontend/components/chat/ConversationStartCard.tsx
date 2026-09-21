"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Stethoscope, Sparkles, ShieldCheck, ArrowRight, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LanguageSelector } from "./LanguageSelector";
import { Conversation } from "@/types/chat";
import { mockChatApi } from "@/lib/mockChatData";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

export const ConversationStartCard: React.FC<{
  activeConversation?: Conversation | null;
}> = ({ activeConversation }) => {
  const { user } = useAuth();
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [isStarting, setIsStarting] = useState(false);

  const handleStartNew = async () => {
    setIsStarting(true);
    try {
      const conv = await mockChatApi.startConversation(user?.id || "usr_demo", language);
      router.push(`/chat/${conv.conversation_id}`);
    } catch (err) {
      alert("Failed to start conversation. Please try again.");
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
      {/* Resume active conversation banner if exists */}
      {activeConversation && activeConversation.status === "active" && (
        <Card className="bg-[#F0FDFA]/70 border-2 border-[#0D9488]/30 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0D9488] text-white flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#0D9488] text-white px-2 py-0.5 rounded-full">
                  Active Session
                </span>
                <span className="text-xs text-[#64748B] font-mono">In Progress</span>
              </div>
              <h3 className="font-heading font-bold text-sm text-[#0F172A] mt-0.5">
                Continue Recent Symptom Assessment
              </h3>
              <p className="text-xs text-[#64748B] line-clamp-1">
                {activeConversation.lastMessageText || "Active conversation"}
              </p>
            </div>
          </div>

          <Button
            onClick={() => router.push(`/chat/${activeConversation.conversation_id}`)}
            variant="primary"
            size="sm"
            className="shrink-0 w-full sm:w-auto"
          >
            <span>Resume Chat</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </Card>
      )}

      {/* Main Start Card */}
      <Card className="p-6 sm:p-8 border-2 border-[#F0FDFA] shadow-clinical-lg flex flex-col gap-6 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0D9488] text-white flex items-center justify-center shrink-0 shadow-clinical">
            <Stethoscope className="w-8 h-8 stroke-[2.2]" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#64748B]">{t.selectLanguage}:</span>
            <LanguageSelector
              currentLanguage={language}
              onSelectLanguage={(lang) => {
                const newLang = lang as "en" | "ta";
                setSelectedLanguage(newLang);
                setLanguage(newLang);
              }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0D9488] bg-[#F0FDFA] px-3 py-1 rounded-full w-fit mx-auto sm:mx-0">
            <Sparkles className="w-3.5 h-3.5" /> AI Triage Assistant
          </div>
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#0F172A] tracking-tight">
            {t.tellUsBothering}
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed max-w-lg">
            {t.tellUsBotheringDesc}
          </p>
        </div>

        {/* Start Button */}
        <div>
          <Button
            onClick={handleStartNew}
            variant="primary"
            size="lg"
            isLoading={isStarting}
            fullWidth
            className="sm:w-auto px-8"
          >
            <Stethoscope className="w-5 h-5 mr-2" />
            {t.startSymptomCheckBtn}
          </Button>
        </div>

        {/* Clinical Disclaimer Reassurance */}
        <div className="pt-4 border-t border-[#F0FDFA] flex items-center gap-2 text-xs text-[#64748B]">
          <ShieldCheck className="w-4 h-4 text-[#0D9488] shrink-0" />
          <span>
            <strong>Clinical Note:</strong> {t.disclaimerNotice}
          </span>
        </div>
      </Card>
    </div>
  );
};
