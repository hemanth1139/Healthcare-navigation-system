import React from "react";
import { FullPatientRecord } from "@/types/profile";
import { Sparkles, CheckCircle2 } from "lucide-react";

export const ProfileCompletenessBar: React.FC<{ record: FullPatientRecord }> = ({ record }) => {
  const calculateCompleteness = (): number => {
    let score = 0;
    const totalWeights = 10;

    const { profile, allergies, chronicConditions, medications } = record;

    if (profile.date_of_birth) score += 1;
    if (profile.gender) score += 1;
    if (profile.blood_group && profile.blood_group !== "Unknown") score += 1;
    if (profile.height_cm && profile.weight_kg) score += 1;
    if (profile.address && profile.city) score += 1;
    if (profile.pincode) score += 1;
    if (profile.emergency_contact_name && profile.emergency_contact_phone) score += 2;
    if (allergies.length > 0) score += 1;
    if (chronicConditions.length > 0 || medications.length > 0) score += 1;

    return Math.round((score / totalWeights) * 100);
  };

  const percentage = calculateCompleteness();

  if (percentage >= 100) {
    return null; // Don't show if profile is 100% complete
  }

  return (
    <div className="bg-[#E6F4F3]/80 border border-[#0F6E7A]/20 rounded-2xl p-4 flex flex-col gap-2.5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#0F6E7A]" />
          <span className="font-heading font-semibold text-xs text-[#1E2A2E]">
            Profile Completeness: <strong className="text-[#0F6E7A] font-mono">{percentage}%</strong>
          </span>
        </div>
        <span className="text-[11px] text-[#5C6B6E] hidden sm:inline">
          Complete your record for accurate clinical triage
        </span>
      </div>

      {/* Progress Bar Track */}
      <div className="w-full h-2 rounded-full bg-white/80 overflow-hidden border border-[#0F6E7A]/10">
        <div
          className="h-full bg-gradient-to-r from-[#0F6E7A] to-[#25A0B0] transition-all duration-500 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
