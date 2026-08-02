import React from "react";
import { CheckCircle2, Info, AlertTriangle, ShieldAlert } from "lucide-react";
import { SeverityLevel } from "@/types/prediction";

export interface SeverityBadgeProps {
  severity: SeverityLevel;
  urgencyText?: string;
  className?: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  urgencyText,
  className = "",
}) => {
  const configs = {
    low: {
      bg: "bg-[#E6F4F3] border-[#0F6E7A]/25 text-[#0F6E7A]",
      icon: <CheckCircle2 className="w-4 h-4 text-[#0F6E7A] shrink-0" />,
      defaultText: "Low Urgency",
    },
    moderate: {
      bg: "bg-[#FEF3C7] border-[#F59E0B]/30 text-[#92400E]",
      icon: <Info className="w-4 h-4 text-[#92400E] shrink-0" />,
      defaultText: "Moderate Urgency",
    },
    high: {
      bg: "bg-[#FFEDD5] border-[#F97316]/30 text-[#C2410C]",
      icon: <AlertTriangle className="w-4 h-4 text-[#C2410C] shrink-0" />,
      defaultText: "High Severity",
    },
    emergency: {
      bg: "bg-[#FDF0EE] border-[#E5573F] text-[#E5573F]",
      icon: <ShieldAlert className="w-4 h-4 text-[#E5573F] shrink-0" />,
      defaultText: "Critical Emergency",
    },
  };

  const current = configs[severity] || configs.moderate;
  const label = urgencyText || current.defaultText;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-2xs ${current.bg} ${className}`}
    >
      {current.icon}
      <span>{label}</span>
    </span>
  );
};
