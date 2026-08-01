"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "md",
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Focus management & Escape key handling
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        previousFocusRef.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#1E2A2E]/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        aria-hidden="true"
      />

      {/* Modal Card Panel */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`relative w-full ${maxWidthStyles[maxWidth]} bg-white rounded-2xl shadow-clinical-lg border-2 border-[#E6F4F3] p-6 z-10 animate-in zoom-in-95 duration-150 focus:outline-none`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#E6F4F3] pb-4 mb-4">
          <div className="flex flex-col gap-0.5">
            <h2 id="modal-title" className="font-heading font-bold text-lg text-[#1E2A2E]">
              {title}
            </h2>
            {subtitle && <p className="text-xs text-[#5C6B6E]">{subtitle}</p>}
          </div>

          <button
            onClick={onClose}
            type="button"
            aria-label="Close modal dialog"
            className="text-[#5C6B6E] hover:text-[#1E2A2E] p-1 rounded-xl hover:bg-[#E6F4F3] transition-colors focus-ring"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div>{children}</div>
      </div>
    </div>
  );
};
