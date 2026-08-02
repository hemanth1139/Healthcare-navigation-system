"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ConversationMessage, QuickReplyOption } from "@/types/chat";
import { FollowUpQuestionCard } from "./FollowUpQuestionCard";
import { HeartPulse, Mic, ArrowRight, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface MessageBubbleProps {
  message: ConversationMessage;
  onSelectQuickReply?: (option: QuickReplyOption) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onSelectQuickReply,
}) => {
  const [showTimestamp, setShowTimestamp] = useState(false);

  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  // System Notification Bubble
  if (message.sender === "system") {
    return (
      <div className="flex justify-center my-2">
        <span className="text-[11px] font-medium text-[#5C6B6E] bg-[#E6F4F3]/80 px-3 py-1 rounded-full border border-[#0F6E7A]/15 text-center">
          {message.message}
        </span>
      </div>
    );
  }

  const isUser = message.sender === "user";

  return (
    <div
      onMouseEnter={() => setShowTimestamp(true)}
      onMouseLeave={() => setShowTimestamp(false)}
      onClick={() => setShowTimestamp(!showTimestamp)}
      className={`flex gap-3 my-2.5 max-w-[85%] sm:max-w-[75%] cursor-pointer ${
        isUser ? "ml-auto flex-row-reverse" : "mr-auto"
      }`}
    >
      {/* Agent Avatar Icon */}
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-[#0F6E7A] text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
          <HeartPulse className="w-4 h-4 stroke-[2.5]" />
        </div>
      )}

      {/* Bubble Container */}
      <div className="flex flex-col gap-1">
        <div
          className={`p-3.5 sm:p-4 rounded-2xl shadow-xs transition-all duration-150 ${
            isUser
              ? "bg-[#E6F4F3] text-[#1E2A2E] rounded-tr-xs border border-[#0F6E7A]/20"
              : message.isEmergencyAlert
              ? "bg-[#FDF0EE] text-[#1E2A2E] rounded-tl-xs border-2 border-[#E5573F]"
              : "bg-white text-[#1E2A2E] rounded-tl-xs border border-[#E6F4F3]"
          }`}
        >
          {/* Voice Input Badge */}
          {message.input_type === "voice" && (
            <div className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0F6E7A] uppercase bg-white/80 px-2 py-0.5 rounded-full mb-1.5 border border-[#0F6E7A]/15">
              <Mic className="w-3 h-3 text-[#0F6E7A]" /> Voice Transcribed
            </div>
          )}

          {/* Main Message Content */}
          <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
            {message.message}
          </p>

          {/* Secondary Translation Line */}
          {message.translated_message && (
            <div className="mt-2 pt-2 border-t border-[#0F6E7A]/15 text-xs text-[#5C6B6E] italic">
              <span className="font-semibold not-italic text-[#0F6E7A]">Translated:</span>{" "}
              {message.translated_message}
            </div>
          )}

          {/* Structured Follow-Up Question Component */}
          {message.followUpQuestion && onSelectQuickReply && (
            <div className="mt-2">
              <FollowUpQuestionCard
                question={message.followUpQuestion}
                onSelectOption={onSelectQuickReply}
              />
            </div>
          )}

          {/* Triage Completed Prediction Link CTA */}
          {message.predictionId && (
            <div className="mt-3 pt-3 border-t border-[#0F6E7A]/20">
              <Link href={`/predictions`}>
                <Button variant="primary" size="sm" fullWidth>
                  <span>View Full Clinical Triage Report</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div
          className={`flex items-center gap-1 text-[10px] text-[#5C6B6E] px-1 transition-opacity ${
            showTimestamp ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          } ${isUser ? "justify-end" : "justify-start"}`}
        >
          <span>{formatTime(message.created_at)}</span>
          {isUser && <CheckCheck className="w-3 h-3 text-[#0F6E7A]" />}
        </div>
      </div>
    </div>
  );
};
