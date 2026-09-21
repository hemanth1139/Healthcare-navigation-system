import React from "react";
import Link from "next/link";
import { AlertTriangle, PhoneCall, Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface EmergencyBannerProps {
  message?: string;
  onDismiss?: () => void;
}

export const EmergencyBanner: React.FC<EmergencyBannerProps> = ({
  message = "CRITICAL MEDICAL ALERT: Symptoms indicate potential cardiac or respiratory emergency. Seek immediate emergency care.",
  onDismiss,
}) => {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="bg-[#FEF2F2] border-2 border-[#EF4444] rounded-2xl p-4 sm:p-5 shadow-clinical-lg animate-in slide-in-from-top-4 duration-200 flex flex-col gap-4 my-3"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#EF4444] text-white flex items-center justify-center shrink-0 shadow-sm">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white bg-[#EF4444] px-2.5 py-0.5 rounded-full">
              High Priority Escalation
            </span>
            <span className="text-xs text-[#EF4444] font-semibold font-mono">Immediate Action Required</span>
          </div>

          <p className="text-xs sm:text-sm font-semibold text-[#0F172A] leading-relaxed mt-1">
            {message}
          </p>
        </div>
      </div>

      {/* Emergency Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-[#EF4444]/20">
        <a href="tel:108" className="w-full sm:w-auto flex-1">
          <Button variant="urgent" size="md" fullWidth>
            <PhoneCall className="w-4 h-4 mr-2 animate-bounce" />
            <span>Call 108 Emergency Services</span>
          </Button>
        </a>

        <Link href="/hospitals" className="w-full sm:w-auto flex-1">
          <Button variant="secondary" size="md" fullWidth className="border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/10">
            <Building2 className="w-4 h-4 mr-2" />
            <span>Find Nearest Emergency Room</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
};
