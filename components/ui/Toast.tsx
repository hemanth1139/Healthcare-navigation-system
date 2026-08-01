"use client";

import React, { useEffect } from "react";
import { CheckCircle2, AlertTriangle, X } from "lucide-react";

export interface ToastProps {
  type?: "success" | "error" | "info";
  title?: string;
  message: string;
  onClose?: () => void;
  autoDismissMs?: number;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  type = "success",
  title,
  message,
  onClose,
  autoDismissMs = type === "success" ? 4000 : undefined,
  className = "",
}) => {
  useEffect(() => {
    if (autoDismissMs && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoDismissMs);
      return () => clearTimeout(timer);
    }
  }, [autoDismissMs, onClose]);

  const styles = {
    success: {
      bg: "bg-[#E6F4F3] border-[#0F6E7A]/30 text-[#0F6E7A]",
      icon: <CheckCircle2 className="w-5 h-5 text-[#0F6E7A] shrink-0 mt-0.5" />,
      titleColor: "text-[#0F6E7A]",
    },
    error: {
      bg: "bg-[#FDF0EE] border-[#E5573F]/40 text-[#1E2A2E]",
      icon: <AlertTriangle className="w-5 h-5 text-[#E5573F] shrink-0 mt-0.5" />,
      titleColor: "text-[#E5573F]",
    },
    info: {
      bg: "bg-[#F7FAFA] border-[#0F6E7A]/20 text-[#1E2A2E]",
      icon: <CheckCircle2 className="w-5 h-5 text-[#0F6E7A] shrink-0 mt-0.5" />,
      titleColor: "text-[#0F6E7A]",
    },
  };

  const current = styles[type];

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`flex items-start justify-between gap-3 p-4 rounded-xl border shadow-sm transition-all duration-200 ${current.bg} ${className}`}
    >
      <div className="flex items-start gap-3">
        {current.icon}
        <div className="flex flex-col gap-0.5">
          {title && <h4 className={`text-sm font-semibold ${current.titleColor}`}>{title}</h4>}
          <p className="text-sm text-[#1E2A2E] leading-relaxed">{message}</p>
        </div>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          type="button"
          aria-label="Close notification"
          className="text-[#5C6B6E] hover:text-[#1E2A2E] p-1 rounded-md transition-colors focus-ring"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
