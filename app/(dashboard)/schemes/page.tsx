"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { ShieldAlert } from "lucide-react";

export default function SchemesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-[#E6F4F3] pb-4">
        <h1 className="font-heading text-2xl font-bold text-[#1E2A2E]">
          Government Health Schemes
        </h1>
        <p className="text-xs sm:text-sm text-[#5C6B6E]">
          Check eligibility for medical insurance subsidies and public healthcare schemes.
        </p>
      </div>

      <Card className="p-8 text-center flex flex-col items-center justify-center gap-4 min-h-[300px]">
        <div className="w-14 h-14 rounded-2xl bg-[#E6F4F3] text-[#0F6E7A] flex items-center justify-center">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="font-heading font-bold text-lg text-[#1E2A2E]">
          Government Schemes Checker Ready
        </h2>
        <p className="text-xs text-[#5C6B6E] max-w-md">
          This route is mounted inside the dashboard navigation shell.
        </p>
      </Card>
    </div>
  );
}
