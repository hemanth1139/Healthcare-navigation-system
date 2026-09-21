"use client";

import React, { useState, useRef, KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { VoiceRecordButton } from "./VoiceRecordButton";
import { Button } from "@/components/ui/Button";

export interface MessageInputProps {
  onSendMessage: (message: string, inputType?: "text" | "voice") => void;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
}) => {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSendMessage(trimmed, "text");
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceTranscribed = (transcribedText: string) => {
    onSendMessage(transcribedText, "voice");
  };

  return (
    <div className="bg-white border-t border-[#F0FDFA] p-3 sm:p-4 shadow-lg sticky bottom-0 z-20">
      <div className="flex items-end gap-2 max-w-4xl mx-auto">
        {/* Voice Recording Button */}
        <VoiceRecordButton onTranscribed={handleVoiceTranscribed} disabled={disabled} />

        {/* Textarea Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            disabled={disabled}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your symptoms or health concerns... (Press Enter to send)"
            aria-label="Type your symptoms or health concerns"
            className="w-full font-body text-xs sm:text-sm text-[#0F172A] bg-[#F8FAFC] placeholder-[#64748B]/70 border border-[#F0FDFA] rounded-xl px-3.5 py-2.5 max-h-32 min-h-[44px] resize-none focus-ring"
          />
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          variant="primary"
          size="md"
          className="shrink-0 rounded-xl px-4 min-h-[44px]"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline ml-1.5">Send</span>
        </Button>
      </div>
    </div>
  );
};
