import React from "react";
import { ShieldCheck } from "lucide-react";

export const PredictionDisclaimer: React.FC = () => {
  return (
    <div className="bg-[#F0FDFA]/60 border border-[#0D9488]/20 rounded-xl p-3.5 flex items-start gap-2.5 my-2">
      <ShieldCheck className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
      <p className="font-body text-xs text-[#64748B] leading-relaxed">
        <strong className="text-[#0F172A] font-medium">Medical Non-Diagnosis Disclaimer:</strong>{" "}
        This report is an AI-generated clinical estimate designed to assist healthcare navigation. It is not a medical diagnosis. Always consult a qualified doctor or healthcare provider for confirmation and treatment.
      </p>
    </div>
  );
};
