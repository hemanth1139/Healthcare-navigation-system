"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Conversation, ConversationMessage, QuickReplyOption } from "@/types/chat";
import { mockChatApi } from "@/lib/mockChatData";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { TypingIndicator } from "./TypingIndicator";
import { EmergencyBanner } from "./EmergencyBanner";
import { LanguageSelector } from "./LanguageSelector";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { Plus, XCircle, HeartPulse, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export interface ChatWindowProps {
  conversationId: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId }) => {
  const { user } = useAuth();
  const router = useRouter();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isWaitingForAgent, setIsWaitingForAgent] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [hasEmergencyAlert, setHasEmergencyAlert] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadChatData = async () => {
    const conv = await mockChatApi.getConversation(conversationId);
    if (!conv) {
      router.push("/symptom-chat");
      return;
    }
    setConversation(conv);
    setHasEmergencyAlert(!!conv.hasEmergencyAlert);

    const msgs = await mockChatApi.getMessages(conversationId);
    setMessages(msgs);
  };

  useEffect(() => {
    loadChatData();
  }, [conversationId]);

  // Auto-scroll to bottom whenever messages list updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isWaitingForAgent]);

  const handleSendMessage = async (text: string, inputType: "text" | "voice" = "text") => {
    if (!text.trim() || isWaitingForAgent) return;

    setIsWaitingForAgent(true);

    try {
      const { userMsg, agentMsg } = await mockChatApi.sendMessage(
        conversationId,
        text,
        inputType
      );

      setMessages((prev) => [...prev, userMsg]);

      // Delay showing agent message to allow TypingIndicator feedback
      setTimeout(() => {
        setMessages((prev) => [...prev, agentMsg]);
        if (agentMsg.isEmergencyAlert) {
          setHasEmergencyAlert(true);
        }
        setIsWaitingForAgent(false);
      }, 700);
    } catch (err) {
      setIsWaitingForAgent(false);
      alert("Failed to send message. Please try again.");
    }
  };

  const handleSelectQuickReply = (option: QuickReplyOption) => {
    handleSendMessage(option.value, "text");
  };

  const handleSelectLanguage = async (newLang: string) => {
    if (!conversation) return;
    const sysMsg = await mockChatApi.switchLanguage(conversationId, newLang);
    setConversation((prev) => (prev ? { ...prev, language: newLang } : null));
    setMessages((prev) => [...prev, sysMsg]);
  };

  const handleEndConversation = async () => {
    await mockChatApi.endConversation(conversationId);
    setShowEndConfirm(false);
    router.push("/symptom-chat");
  };

  const handleStartNew = async () => {
    const newConv = await mockChatApi.startConversation(
      user?.id || "usr_demo",
      conversation?.language || "en"
    );
    router.push(`/chat/${newConv.conversation_id}`);
  };

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <span className="text-xs text-[#5C6B6E]">Loading conversation session...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-4xl mx-auto bg-white rounded-2xl border-2 border-[#E6F4F3] shadow-clinical-lg overflow-hidden relative">
      {/* 1. Sub-Header within Chat Viewport */}
      <div className="bg-[#F7FAFA] border-b border-[#E6F4F3] px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <Link
            href="/symptom-chat"
            className="p-1.5 rounded-lg text-[#5C6B6E] hover:bg-[#E6F4F3] hover:text-[#0F6E7A] focus-ring transition-colors"
            title="Back to Symptom Check landing"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="w-8 h-8 rounded-xl bg-[#0F6E7A] text-white flex items-center justify-center">
            <HeartPulse className="w-4 h-4" />
          </div>

          <div className="flex flex-col">
            <span className="font-heading font-bold text-sm text-[#1E2A2E]">
              AI Triage Assistant
            </span>
            <span className="text-[10px] text-[#5C6B6E] font-mono">
              Session #{conversationId.slice(-6)}
            </span>
          </div>
        </div>

        {/* Right Actions: Language Selector, New Conv, End Conv */}
        <div className="flex items-center gap-2">
          <LanguageSelector
            currentLanguage={conversation.language}
            onSelectLanguage={handleSelectLanguage}
            compact
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={handleStartNew}
            className="hidden sm:inline-flex"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            New
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEndConfirm(true)}
            className="text-[#E5573F] hover:bg-[#FDF0EE]"
          >
            <XCircle className="w-3.5 h-3.5 mr-1" />
            <span className="hidden sm:inline">End</span>
          </Button>
        </div>
      </div>

      {/* 2. Scrollable Messages Area */}
      <div
        className="flex-1 p-4 sm:p-6 overflow-y-auto bg-gradient-to-b from-[#F7FAFA]/50 to-white"
        aria-live="polite"
      >
        {/* High-Priority Emergency Escalation Banner if flagged */}
        {hasEmergencyAlert && <EmergencyBanner />}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.message_id}
            message={msg}
            onSelectQuickReply={handleSelectQuickReply}
          />
        ))}

        {isWaitingForAgent && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Bottom Message Input Bar */}
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={isWaitingForAgent || conversation.status === "completed"}
      />

      {/* End Conversation Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showEndConfirm}
        onClose={() => setShowEndConfirm(false)}
        onConfirm={handleEndConversation}
        title="End Triage Session?"
        message="Are you sure you want to end this symptom check session? Your conversation logs will be saved to your predictions history."
        confirmLabel="End Conversation"
        isDestructive={false}
      />
    </div>
  );
};
