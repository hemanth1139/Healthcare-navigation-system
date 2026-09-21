"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { UserCheck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function SpecialistsPage() {
  const { t, language } = useLanguage();

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-[#F0FDFA] pb-4">
        <h1 className="font-heading text-2xl font-bold text-[#0F172A]">
          {t.specialists}
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B]">
          {language === "ta"
            ? "உங்கள் அறிகுறி ஆய்வுக்கு ஏற்ற மருத்துவ நிபுணர்களைக் கண்டறியவும்."
            : "Find matched medical specialists based on your clinical assessment."}
        </p>
      </div>

      <Card className="p-8 text-center flex flex-col items-center justify-center gap-4 min-h-[300px]">
        <div className="w-14 h-14 rounded-2xl bg-[#F0FDFA] text-[#0D9488] flex items-center justify-center">
          <UserCheck className="w-7 h-7" />
        </div>
        <h2 className="font-heading font-bold text-lg text-[#0F172A]">
          {language === "ta" ? "மருத்துவ நிபுணர்கள் அடைவு தயார்" : "Specialist Directory Ready"}
        </h2>
        <p className="text-xs text-[#64748B] max-w-md">
          {language === "ta"
            ? "அறிகுறி மதிப்பீட்டின் படி தகுதியான இருதயவியல், நரம்பியல், மற்றும் பொது மருத்துவ நிபுணர்கள் இணைக்கப்பட்டுள்ளனர்."
            : "Matched cardiologists, neurologists, and general physicians connected based on your symptom triage."}
        </p>
      </Card>
    </div>
  );
}
