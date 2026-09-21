"use client";

import React from "react";
import { ShieldAlert, AlertTriangle, CheckCircle, Clock } from "lucide-react";

type Severity = "low" | "moderate" | "high" | "emergency";

interface SeverityBadgeProps {
  severity: Severity;
  urgencyText?: string;
}

const SEVERITY_CONFIG: Record<
  Severity,
  { label: string; icon: React.ComponentType<{ className?: string }>; classes: string }
> = {
  low: {
    label: "Low Severity",
    icon: CheckCircle,
    classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  moderate: {
    label: "Moderate",
    icon: Clock,
    classes: "bg-amber-50 text-amber-700 border-amber-200",
  },
  high: {
    label: "High Urgency",
    icon: AlertTriangle,
    classes: "bg-orange-50 text-orange-700 border-orange-200",
  },
  emergency: {
    label: "Emergency",
    icon: ShieldAlert,
    classes: "bg-red-50 text-red-700 border-red-200 animate-pulse",
  },
};

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  urgencyText,
}) => {
  const config = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.moderate;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold tracking-wide ${config.classes}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      {urgencyText || config.label}
    </span>
  );
};
