"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-[#E6F4F3] pb-4">
        <h1 className="font-heading text-2xl font-bold text-[#1E2A2E]">
          Account & Portal Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#5C6B6E]">
          Manage security preferences, notification alerts, and language choices.
        </p>
      </div>

      <Card className="p-8 text-center flex flex-col items-center justify-center gap-4 min-h-[300px]">
        <div className="w-14 h-14 rounded-2xl bg-[#E6F4F3] text-[#0F6E7A] flex items-center justify-center">
          <Settings className="w-7 h-7" />
        </div>
        <h2 className="font-heading font-bold text-lg text-[#1E2A2E]">
          Account Settings Ready
        </h2>
        <p className="text-xs text-[#5C6B6E] max-w-md">
          This route is mounted inside the dashboard navigation shell.
        </p>
      </Card>
    </div>
  );
}
