import React from "react";
import { ShieldCheck, Lock } from "lucide-react";

export const PiiRedactionBadge: React.FC<{ isRedacted: boolean; className?: string }> = ({
  isRedacted,
  className = "",
}) => {
  if (!isRedacted) return null;

  return (
    <span
      title="Sensitive personal identifiers (name, phone, Aadhaar) have been automatically redacted via Presidio PII pipeline."
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F0FDFA] text-[#0D9488] border border-[#0D9488]/20 shadow-2xs ${className}`}
    >
      <ShieldCheck className="w-3 h-3 text-[#0D9488] shrink-0" />
      <span>PII Protected</span>
    </span>
  );
};
