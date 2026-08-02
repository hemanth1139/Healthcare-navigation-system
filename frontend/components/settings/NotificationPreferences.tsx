"use client";

import React, { useState } from "react";
import { ShieldAlert, Bell, Sparkles, Lock } from "lucide-react";

export const NotificationPreferences: React.FC = () => {
  const [tipsNotify, setTipsNotify] = useState(true);
  const [schemesNotify, setSchemesNotify] = useState(true);

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Emergency Escalation Alerts (LOCKED ON) */}
      <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-[#FDF0EE] dark:bg-[#2C1A18] border border-[#E5573F]/40">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#E5573F] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <ShieldAlert className="w-5 h-5" />
          </div>

          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-sm text-[#1E2A2E] dark:text-[#F7FAFA]">
                Critical Emergency Escalation Alerts
              </span>
              <span className="text-[10px] font-bold uppercase text-[#E5573F] bg-white dark:bg-[#121C1F] px-2 py-0.5 rounded-full border border-[#E5573F]/30 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Mandatory Safety Active
              </span>
            </div>
            <p className="text-xs text-[#5C6B6E] dark:text-[#A3B2B5]">
              High-priority alerts for life-threatening triage symptoms (chest pain, acute breathlessness). Emergency alerts cannot be disabled for your safety.
            </p>
          </div>
        </div>

        {/* Disabled Locked Switch */}
        <div className="relative inline-flex items-center cursor-not-allowed opacity-80 shrink-0 mt-1">
          <input type="checkbox" checked disabled className="sr-only" />
          <div className="w-11 h-6 bg-[#E5573F] rounded-full p-1 transition-colors">
            <div className="w-4 h-4 bg-white rounded-full translate-x-5 shadow-md" />
          </div>
        </div>
      </div>

      {/* 2. Health Tips Reminders */}
      <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-[#F7FAFA] dark:bg-[#121C1F] border border-[#E6F4F3] dark:border-[#25363B]">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#E6F4F3] dark:bg-[#0F6E7A]/20 text-[#0F6E7A] dark:text-[#25A0B0] flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="font-heading font-bold text-sm text-[#1E2A2E] dark:text-[#F7FAFA]">
              Personalized Health Tip Advisories
            </span>
            <p className="text-xs text-[#5C6B6E] dark:text-[#A3B2B5]">
              Receive seasonal wellness warnings, hydration reminders, and condition management advisories.
            </p>
          </div>
        </div>

        <button
          onClick={() => setTipsNotify(!tipsNotify)}
          type="button"
          aria-label="Toggle health tip reminders"
          className="relative inline-flex items-center cursor-pointer shrink-0 mt-1 focus-ring rounded-full"
        >
          <div
            className={`w-11 h-6 rounded-full p-1 transition-colors ${
              tipsNotify ? "bg-[#0F6E7A]" : "bg-gray-300 dark:bg-gray-700"
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full transition-transform shadow-md ${
                tipsNotify ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </div>
        </button>
      </div>

      {/* 3. Scheme Update Notifications */}
      <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-[#F7FAFA] dark:bg-[#121C1F] border border-[#E6F4F3] dark:border-[#25363B]">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#E6F4F3] dark:bg-[#0F6E7A]/20 text-[#0F6E7A] dark:text-[#25A0B0] flex items-center justify-center shrink-0 mt-0.5">
            <Bell className="w-5 h-5" />
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="font-heading font-bold text-sm text-[#1E2A2E] dark:text-[#F7FAFA]">
              Government Scheme Eligibility Updates
            </span>
            <p className="text-xs text-[#5C6B6E] dark:text-[#A3B2B5]">
              Notifications when new state or central healthcare subsidies matching your profile are launched.
            </p>
          </div>
        </div>

        <button
          onClick={() => setSchemesNotify(!schemesNotify)}
          type="button"
          aria-label="Toggle scheme update notifications"
          className="relative inline-flex items-center cursor-pointer shrink-0 mt-1 focus-ring rounded-full"
        >
          <div
            className={`w-11 h-6 rounded-full p-1 transition-colors ${
              schemesNotify ? "bg-[#0F6E7A]" : "bg-gray-300 dark:bg-gray-700"
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full transition-transform shadow-md ${
                schemesNotify ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </div>
        </button>
      </div>
    </div>
  );
};
