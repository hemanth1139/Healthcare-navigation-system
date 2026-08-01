"use client";

import React, { useState, useEffect } from "react";
import { ConversationStartCard } from "@/components/chat/ConversationStartCard";
import { Conversation } from "@/types/chat";
import { mockChatApi } from "@/lib/mockChatData";
import { Spinner } from "@/components/ui/Spinner";

export default function ChatLandingPage() {
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);

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
        <span className="text-xs text-[#5C6B6E] mt-2">Preparing AI symptom check...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      <ConversationStartCard activeConversation={activeConv} />
    </div>
  );
}
