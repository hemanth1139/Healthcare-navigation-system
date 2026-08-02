"use client";

import React from "react";
import { UploadProgressState } from "@/types/record";
import { CloudUpload, ShieldCheck, Database, CheckCircle2 } from "lucide-react";

export const UploadProgressToast: React.FC<{ progress: UploadProgressState | null }> = ({
  progress,
}) => {
  if (!progress) return null;

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="File upload progress status"
      className="fixed bottom-6 right-6 z-50 bg-white border-2 border-[#0F6E7A]/40 rounded-2xl p-4 shadow-clinical-lg max-w-sm w-full animate-in slide-in-from-bottom-4 duration-200"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#0F6E7A] text-white flex items-center justify-center shrink-0">
          {progress.status === "completed" ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : progress.status === "redacting_pii" ? (
            <ShieldCheck className="w-5 h-5 animate-pulse" />
          ) : (
            <CloudUpload className="w-5 h-5 animate-bounce" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-xs font-bold text-[#1E2A2E] truncate">
              {progress.file_name}
            </span>
            <span className="text-xs font-mono font-bold text-[#0F6E7A]">
              {progress.progress_pct}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-[#E6F4F3] rounded-full overflow-hidden mb-1">
            <div
              className="h-full bg-[#0F6E7A] rounded-full transition-all duration-300"
              style={{ width: `${progress.progress_pct}%` }}
            />
          </div>

          <span className="text-[10px] text-[#5C6B6E] font-medium">
            {progress.status === "uploading" && "Uploading document to Cloudinary..."}
            {progress.status === "redacting_pii" && "Presidio PII Redaction Pipeline..."}
            {progress.status === "fhir_indexing" && "Indexing HL7 FHIR Diagnostic Resource..."}
            {progress.status === "completed" && "Record uploaded & PII protected!"}
          </span>
        </div>
      </div>
    </div>
  );
};
