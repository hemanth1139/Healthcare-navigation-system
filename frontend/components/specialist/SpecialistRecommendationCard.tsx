"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SpecialistRecommendation } from "@/types/specialist";
import { SeverityBadge } from "@/components/predictions/SeverityBadge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { UserCheck, Stethoscope, ArrowRight, ArrowLeft, ShieldAlert } from "lucide-react";

export interface SpecialistRecommendationCardProps {
  recommendation: SpecialistRecommendation;
  isEmergency?: boolean;
}

export const SpecialistRecommendationCard: React.FC<SpecialistRecommendationCardProps> = ({
  recommendation,
  isEmergency = false,
}) => {
  const router = useRouter();

  const handleFindHospitals = () => {
    // Extract main specialty name for search filter
    const primarySpecialty = recommendation.specialist.split("&")[0].trim();
    router.push(`/hospitals?specialist=${encodeURIComponent(primarySpecialty)}`);
  };

  return (
    <Card className="p-6 sm:p-8 border-2 border-[#E6F4F3] shadow-clinical-lg flex flex-col gap-6 max-w-2xl mx-auto">
      {/* Header Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E6F4F3] pb-4">
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-[#0F6E7A] text-white flex items-center justify-center shrink-0 shadow-clinical">
            <Stethoscope className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F6E7A] bg-[#E6F4F3] px-2.5 py-0.5 rounded-full">
              Recommended Specialty
            </span>
            <h1 className="font-heading font-bold text-2xl sm:text-3xl text-[#1E2A2E] mt-0.5">
              {recommendation.specialist}
            </h1>
          </div>
        </div>

        {/* Severity Context Badge Reused from Phase 5 */}
        <SeverityBadge
          severity={isEmergency ? "emergency" : "moderate"}
          urgencyText={recommendation.urgency_note}
        />
      </div>

      {/* Clinical Rationale Reason Box */}
      <div className="bg-[#F7FAFA] border border-[#E6F4F3] rounded-2xl p-4 sm:p-5 flex flex-col gap-2">
        <h3 className="font-heading font-semibold text-xs text-[#0F6E7A] uppercase tracking-wider flex items-center gap-1.5">
          <UserCheck className="w-4 h-4" /> Clinical Rationale & Triage Match
        </h3>
        <p className="text-xs sm:text-sm text-[#1E2A2E] leading-relaxed">
          {recommendation.reason}
        </p>
      </div>

      {/* Associated Symptoms Tags */}
      {recommendation.associated_symptoms && recommendation.associated_symptoms.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-[#5C6B6E]">Associated Symptom Triggers:</span>
          <div className="flex flex-wrap gap-2">
            {recommendation.associated_symptoms.map((sym) => (
              <span
                key={sym}
                className="text-xs font-semibold text-[#1E2A2E] bg-[#E6F4F3]/70 px-3 py-1 rounded-full border border-[#0F6E7A]/20"
              >
                • {sym}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Primary Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-[#E6F4F3]">
        <Button
          onClick={handleFindHospitals}
          variant="primary"
          size="lg"
          fullWidth
          className="sm:flex-1"
        >
          <span>Find Hospitals With This Specialist</span>
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>

        <Link
          href={`/predictions/${recommendation.prediction_id}`}
          className="w-full sm:w-auto"
        >
          <Button variant="ghost" size="lg" fullWidth>
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Back to Triage Results</span>
          </Button>
        </Link>
      </div>
    </Card>
  );
};
