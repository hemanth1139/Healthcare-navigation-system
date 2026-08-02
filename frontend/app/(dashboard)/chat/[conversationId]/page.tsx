"use client";

import React from "react";
import { useParams } from "next/navigation";
import { ChatWindow } from "@/components/chat/ChatWindow";

export default function ActiveChatPage() {
  const params = useParams();
  const conversationId = params?.conversationId as string;

  return (
    <div className="py-2">
      <ChatWindow conversationId={conversationId} />
    </div>
  );
}
