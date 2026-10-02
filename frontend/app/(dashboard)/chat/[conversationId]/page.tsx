"use client";

import React from "react";
import { ChatWindow } from "@/components/chat/ChatWindow";

export default function ActiveChatPage({ params }: { params: { conversationId: string } }) {
  const { conversationId } = params;

  return (
    <div className="py-2">
      <ChatWindow conversationId={conversationId} />
    </div>
  );
}
