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

export const ConversationStartCard: React.FC<{
  activeConversation?: Conversation | null;
}> = ({ activeConversation }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [isStarting, setIsStarting] = useState(false);

  const handleStartNew = async () => {
    setIsStarting(true);
    try {
      const conv = await mockChatApi.startConversation(user?.id || "usr_demo", selectedLanguage);
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
        <Card className="bg-[#E6F4F3]/70 border-2 border-[#0F6E7A]/30 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F6E7A] text-white flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#0F6E7A] text-white px-2 py-0.5 rounded-full">
                  Active Session
                </span>
                <span className="text-xs text-[#5C6B6E] font-mono">In Progress</span>
              </div>
              <h3 className="font-heading font-bold text-sm text-[#1E2A2E] mt-0.5">
                Continue Recent Symptom Assessment
              </h3>
              <p className="text-xs text-[#5C6B6E] line-clamp-1">
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
      <Card className="p-6 sm:p-8 border-2 border-[#E6F4F3] shadow-clinical-lg flex flex-col gap-6 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0F6E7A] text-white flex items-center justify-center shrink-0 shadow-clinical">
            <Stethoscope className="w-8 h-8 stroke-[2.2]" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#5C6B6E]">Language:</span>
            <LanguageSelector
              currentLanguage={selectedLanguage}
              onSelectLanguage={(lang) => setSelectedLanguage(lang)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F6E7A] bg-[#E6F4F3] px-3 py-1 rounded-full w-fit mx-auto sm:mx-0">
            <Sparkles className="w-3.5 h-3.5" /> AI Triage Assistant
          </div>
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#1E2A2E] tracking-tight">
            Tell us what&apos;s bothering you
          </h2>
          <p className="text-xs sm:text-sm text-[#5C6B6E] leading-relaxed max-w-lg">
            Share your symptoms in plain language or voice audio. Our AI Clinical Assistant will guide your triage steps and help locate appropriate care specialists.
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
            Start Symptom Check
          </Button>
        </div>

        {/* Clinical Disclaimer Reassurance */}
        <div className="pt-4 border-t border-[#E6F4F3] flex items-center gap-2 text-xs text-[#5C6B6E]">
          <ShieldCheck className="w-4 h-4 text-[#0F6E7A] shrink-0" />
          <span>
            <strong>Clinical Note:</strong> This assessment provides triage recommendations and next steps, not a definitive medical diagnosis. For life-threatening emergencies, call 108 immediately.
          </span>
        </div>
      </Card>
    </div>
  );
};
