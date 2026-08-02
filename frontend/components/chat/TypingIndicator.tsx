import React from "react";
import { HeartPulse } from "lucide-react";

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center gap-3 my-2.5 mr-auto max-w-[80%] animate-in fade-in duration-200">
      <div className="w-8 h-8 rounded-xl bg-[#0F6E7A] text-white flex items-center justify-center shrink-0 shadow-xs">
        <HeartPulse className="w-4 h-4 animate-pulse stroke-[2.5]" />
      </div>

      <div className="bg-white border border-[#E6F4F3] px-4 py-3 rounded-2xl rounded-tl-xs shadow-xs flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#0F6E7A] animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 rounded-full bg-[#0F6E7A] animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 rounded-full bg-[#0F6E7A] animate-bounce" />
        <span className="text-xs text-[#5C6B6E] ml-2 font-medium">
          Analyzing clinical triage...
        </span>
      </div>
    </div>
  );
};
