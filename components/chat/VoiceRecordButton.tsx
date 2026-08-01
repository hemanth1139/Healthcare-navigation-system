"use client";

import React, { useState, useEffect } from "react";
import { Mic, Square, X, Loader2 } from "lucide-react";

export interface VoiceRecordButtonProps {
  onTranscribed: (text: string) => void;
  disabled?: boolean;
}

export const VoiceRecordButton: React.FC<VoiceRecordButtonProps> = ({
  onTranscribed,
  disabled = false,
}) => {
  const [status, setStatus] = useState<"idle" | "recording" | "processing">("idle");
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === "recording") {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setSeconds(0);
    }
    return () => clearInterval(interval);
  }, [status]);

  const startRecording = () => {
    if (disabled) return;
    setStatus("recording");
  };

  const stopRecording = async () => {
    if (status !== "recording") return;
    setStatus("processing");

    // Simulate Whisper voice-to-text API latency
    setTimeout(() => {
      setStatus("idle");
      onTranscribed(
        "I have been feeling a throbbing headache since this morning and mild fever around 100°F."
      );
    }, 1200);
  };

  const cancelRecording = () => {
    setStatus("idle");
    setSeconds(0);
  };

  if (status === "recording") {
    return (
      <div
        role="region"
        aria-live="polite"
        aria-label="Voice recording active"
        className="flex items-center gap-2 bg-[#FDF0EE] border-2 border-[#E5573F]/40 px-3 py-1.5 rounded-xl animate-pulse"
      >
        <button
          onClick={stopRecording}
          type="button"
          aria-label="Stop recording and transcribe"
          className="w-7 h-7 rounded-lg bg-[#E5573F] text-white flex items-center justify-center focus-ring cursor-pointer"
        >
          <Square className="w-3.5 h-3.5 fill-white" />
        </button>

        <span className="text-xs font-mono font-bold text-[#E5573F] min-w-[36px]">
          0:0{seconds}
        </span>

        <span className="text-[11px] font-semibold text-[#1E2A2E] hidden sm:inline">
          Recording... (Tap stop when done)
        </span>

        <button
          onClick={cancelRecording}
          type="button"
          aria-label="Cancel voice recording"
          className="text-[#5C6B6E] hover:text-[#1E2A2E] p-1 rounded-md focus-ring"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (status === "processing") {
    return (
      <div className="flex items-center gap-2 bg-[#E6F4F3] px-3 py-1.5 rounded-xl border border-[#0F6E7A]/20">
        <Loader2 className="w-4 h-4 text-[#0F6E7A] animate-spin" />
        <span className="text-xs font-semibold text-[#0F6E7A]">Transcribing voice...</span>
      </div>
    );
  }

  return (
    <button
      onClick={startRecording}
      disabled={disabled}
      type="button"
      aria-label="Record voice symptom description"
      title="Record voice message"
      className="p-2.5 rounded-xl text-[#0F6E7A] bg-[#E6F4F3]/70 hover:bg-[#E6F4F3] border border-[#0F6E7A]/20 focus-ring transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
    >
      <Mic className="w-5 h-5" />
    </button>
  );
};
