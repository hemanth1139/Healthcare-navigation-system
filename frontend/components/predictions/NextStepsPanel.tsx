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
      <div className="border-b border-[#F0FDFA] pb-3">
        <h2 className="font-heading font-bold text-base text-[#0F172A]">
          Recommended Clinical Next Steps
        </h2>
        <p className="text-xs text-[#64748B]">
          Actionable navigation pathways tailored to your triage report
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Specialist CTA */}
        <Link href="/specialists" className="block group focus-ring rounded-2xl">
          <div
            className={`p-4 rounded-xl border-2 transition-all flex flex-col justify-between gap-3 h-full ${
              isHighOrEmergency
                ? "bg-[#F0FDFA] border-[#0D9488] shadow-sm"
                : "bg-white border-[#F0FDFA] hover:border-[#0D9488]"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#0D9488] text-white flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase text-[#0D9488] bg-white px-2 py-0.5 rounded-full border border-[#0D9488]/20">
                Recommended
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="font-heading font-bold text-sm text-[#0F172A] group-hover:text-[#0D9488] transition-colors flex items-center justify-between">
                <span>See Matched Specialist</span>
                <ArrowRight className="w-4 h-4 text-[#0D9488] group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-xs text-[#64748B]">
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
                ? "bg-[#FEF2F2] border-[#EF4444]/60 shadow-sm"
                : "bg-white border-[#F0FDFA] hover:border-[#0D9488]"
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isHighOrEmergency ? "bg-[#EF4444] text-white" : "bg-[#F0FDFA] text-[#0D9488]"
                }`}
              >
                <Building2 className="w-5 h-5" />
              </div>
              {isHighOrEmergency && (
                <span className="text-[10px] font-bold uppercase text-[#EF4444] bg-white px-2 py-0.5 rounded-full border border-[#EF4444]/20">
                  Urgent Facility
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="font-heading font-bold text-sm text-[#0F172A] group-hover:text-[#0D9488] transition-colors flex items-center justify-between">
                <span>Locate Nearby Hospitals</span>
                <ArrowRight className="w-4 h-4 text-[#64748B] group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-xs text-[#64748B]">
                Find emergency trauma units and specialized hospital wards near you.
              </p>
            </div>
          </div>
        </Link>

        {/* Government Schemes CTA */}
        <Link href="/schemes" className="block group focus-ring rounded-2xl">
          <div className="p-4 rounded-xl border-2 border-[#F0FDFA] hover:border-[#0D9488] bg-white transition-all flex flex-col justify-between gap-3 h-full">
            <div className="w-10 h-10 rounded-xl bg-[#F0FDFA] text-[#0D9488] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="font-heading font-bold text-sm text-[#0F172A] group-hover:text-[#0D9488] transition-colors flex items-center justify-between">
                <span>Check Scheme Subsidies</span>
                <ArrowRight className="w-4 h-4 text-[#64748B] group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-xs text-[#64748B]">
                Explore Ayushman Bharat PM-JAY and government health subsidies.
              </p>
            </div>
          </div>
        </Link>

        {/* Health Tips CTA */}
        <Link href="/tips" className="block group focus-ring rounded-2xl">
          <div className="p-4 rounded-xl border-2 border-[#F0FDFA] hover:border-[#0D9488] bg-white transition-all flex flex-col justify-between gap-3 h-full">
            <div className="w-10 h-10 rounded-xl bg-[#F0FDFA] text-[#0D9488] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="font-heading font-bold text-sm text-[#0F172A] group-hover:text-[#0D9488] transition-colors flex items-center justify-between">
                <span>Read Self-Care Guidelines</span>
                <ArrowRight className="w-4 h-4 text-[#64748B] group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-xs text-[#64748B]">
                Review evidence-based symptom management and hydration tips.
              </p>
            </div>
          </div>
        </Link>
      </div>
    </Card>
  );
};
