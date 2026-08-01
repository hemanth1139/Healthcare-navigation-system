import React from "react";
import Link from "next/link";
import { UserCheck, Building2, ShieldAlert, Sparkles, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SeverityLevel } from "@/types/prediction";

export interface NextStepsPanelProps {
  severity: SeverityLevel;
  specialistCategory?: string;
}

export const NextStepsPanel: React.FC<NextStepsPanelProps> = ({
  severity,
  specialistCategory = "General Physician / Specialist",
}) => {
  const isHighOrEmergency = severity === "high" || severity === "emergency";

  return (
    <Card className="p-5 sm:p-6 flex flex-col gap-5">
      <div className="border-b border-[#E6F4F3] pb-3">
        <h2 className="font-heading font-bold text-base text-[#1E2A2E]">
          Recommended Clinical Next Steps
        </h2>
        <p className="text-xs text-[#5C6B6E]">
          Actionable navigation pathways tailored to your triage report
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Specialist CTA */}
        <Link href="/specialists" className="block group focus-ring rounded-2xl">
          <div
            className={`p-4 rounded-xl border-2 transition-all flex flex-col justify-between gap-3 h-full ${
              isHighOrEmergency
                ? "bg-[#E6F4F3] border-[#0F6E7A] shadow-sm"
                : "bg-white border-[#E6F4F3] hover:border-[#0F6E7A]"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#0F6E7A] text-white flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase text-[#0F6E7A] bg-white px-2 py-0.5 rounded-full border border-[#0F6E7A]/20">
                Recommended
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="font-heading font-bold text-sm text-[#1E2A2E] group-hover:text-[#0F6E7A] transition-colors flex items-center justify-between">
                <span>See Matched Specialist</span>
                <ArrowRight className="w-4 h-4 text-[#0F6E7A] group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-xs text-[#5C6B6E]">
                Connect with verified specialists in <strong>{specialistCategory}</strong>.
              </p>
            </div>
          </div>
        </Link>

        {/* Hospital Finder CTA */}
        <Link href="/hospitals" className="block group focus-ring rounded-2xl">
          <div
            className={`p-4 rounded-xl border-2 transition-all flex flex-col justify-between gap-3 h-full ${
              isHighOrEmergency
                ? "bg-[#FDF0EE] border-[#E5573F]/60 shadow-sm"
                : "bg-white border-[#E6F4F3] hover:border-[#0F6E7A]"
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isHighOrEmergency ? "bg-[#E5573F] text-white" : "bg-[#E6F4F3] text-[#0F6E7A]"
                }`}
              >
                <Building2 className="w-5 h-5" />
              </div>
              {isHighOrEmergency && (
                <span className="text-[10px] font-bold uppercase text-[#E5573F] bg-white px-2 py-0.5 rounded-full border border-[#E5573F]/20">
                  Urgent Facility
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="font-heading font-bold text-sm text-[#1E2A2E] group-hover:text-[#0F6E7A] transition-colors flex items-center justify-between">
                <span>Locate Nearby Hospitals</span>
                <ArrowRight className="w-4 h-4 text-[#5C6B6E] group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-xs text-[#5C6B6E]">
                Find emergency trauma units and specialized hospital wards near you.
              </p>
            </div>
          </div>
        </Link>

        {/* Government Schemes CTA */}
        <Link href="/schemes" className="block group focus-ring rounded-2xl">
          <div className="p-4 rounded-xl border-2 border-[#E6F4F3] hover:border-[#0F6E7A] bg-white transition-all flex flex-col justify-between gap-3 h-full">
            <div className="w-10 h-10 rounded-xl bg-[#E6F4F3] text-[#0F6E7A] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="font-heading font-bold text-sm text-[#1E2A2E] group-hover:text-[#0F6E7A] transition-colors flex items-center justify-between">
                <span>Check Scheme Subsidies</span>
                <ArrowRight className="w-4 h-4 text-[#5C6B6E] group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-xs text-[#5C6B6E]">
                Explore Ayushman Bharat PM-JAY and government health subsidies.
              </p>
            </div>
          </div>
        </Link>

        {/* Health Tips CTA */}
        <Link href="/tips" className="block group focus-ring rounded-2xl">
          <div className="p-4 rounded-xl border-2 border-[#E6F4F3] hover:border-[#0F6E7A] bg-white transition-all flex flex-col justify-between gap-3 h-full">
            <div className="w-10 h-10 rounded-xl bg-[#E6F4F3] text-[#0F6E7A] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="font-heading font-bold text-sm text-[#1E2A2E] group-hover:text-[#0F6E7A] transition-colors flex items-center justify-between">
                <span>Read Self-Care Guidelines</span>
                <ArrowRight className="w-4 h-4 text-[#5C6B6E] group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-xs text-[#5C6B6E]">
                Review evidence-based symptom management and hydration tips.
              </p>
            </div>
          </div>
        </Link>
      </div>
    </Card>
  );
};
