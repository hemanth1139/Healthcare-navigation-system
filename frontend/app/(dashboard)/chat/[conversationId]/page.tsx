"use client";

import React, { use } from "react";
import { ChatWindow } from "@/components/chat/ChatWindow";

export default function ActiveChatPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = use(params);

  return (
    <div className="py-2">
      <ChatWindow conversationId={conversationId} />
    </div>
  );
}
