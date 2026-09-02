"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import {
  User,
  Pill,
  AlertCircle,
  Heart,
  ClipboardList,
  Info,
} from "lucide-react";

interface PatientContextItem {
  label: string;
  value: string;
}

interface PatientContextBannerProps {
  patientName: string;
  age?: number;
  gender?: string;
  allergies?: string[];
  medications?: string[];
  conditions?: string[];
  relevantConsultationCount?: number;
  compact?: boolean;
}

export const PatientContextBanner: React.FC<PatientContextBannerProps> = ({
  patientName,
  age,
  gender,
  allergies = [],
  medications = [],
  conditions = [],
  relevantConsultationCount = 0,
  compact = false,
}) => {
  const contextItems: PatientContextItem[] = [
    ...(allergies.length > 0
      ? [{ label: "Allergies", value: allergies.join(", ") }]
      : []),
    ...(medications.length > 0
      ? [{ label: "Medications", value: medications.join(", ") }]
      : []),
    ...(conditions.length > 0
      ? [{ label: "Conditions", value: conditions.join(", ") }]
      : []),
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-700">
        <Info className="w-3.5 h-3.5 shrink-0" />
        <span>
          Patient context loaded for{" "}
          <strong>{patientName}</strong>
          {age ? `, ${age}` : ""}
          {gender ? ` • ${gender}` : ""}
          {relevantConsultationCount > 0
            ? ` • ${relevantConsultationCount} prior consultation(s) considered`
            : ""}
        </span>
      </div>
    );
  }

  return (
    <Card className="border border-blue-100 bg-blue-50/40 p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
          <User className="w-3.5 h-3.5" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
            Active Patient Context
          </p>
          <p className="text-xs font-semibold text-slate-900">
            {patientName}
            {age ? `, ${age} yrs` : ""}
            {gender ? ` • ${gender}` : ""}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-white border border-slate-200 rounded-full px-2 py-0.5">
          <Info className="w-3 h-3" />
          Context-aware AI
        </div>
      </div>

      {/* Context Grid */}
      {contextItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {allergies.length > 0 && (
            <div className="flex items-start gap-2 bg-white/80 rounded-lg p-2.5 border border-red-100">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-red-600 uppercase">Allergies</p>
                <p className="text-[11px] text-slate-700 mt-0.5">{allergies.join(", ")}</p>
              </div>
            </div>
          )}
          {medications.length > 0 && (
            <div className="flex items-start gap-2 bg-white/80 rounded-lg p-2.5 border border-blue-100">
              <Pill className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-blue-600 uppercase">Medications</p>
                <p className="text-[11px] text-slate-700 mt-0.5">{medications.join(", ")}</p>
              </div>
            </div>
          )}
          {conditions.length > 0 && (
            <div className="flex items-start gap-2 bg-white/80 rounded-lg p-2.5 border border-purple-100">
              <Heart className="w-3.5 h-3.5 text-purple-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-purple-600 uppercase">Conditions</p>
                <p className="text-[11px] text-slate-700 mt-0.5">{conditions.join(", ")}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Prior Consultations */}
      {relevantConsultationCount > 0 && (
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <ClipboardList className="w-3.5 h-3.5 shrink-0" />
          <span>
            <strong className="text-slate-700">{relevantConsultationCount}</strong> relevant prior
            consultation(s) incorporated into AI context
          </span>
        </div>
      )}
    </Card>
  );
};
