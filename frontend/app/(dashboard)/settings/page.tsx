"use client";

import React from "react";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { LanguagePreference } from "@/components/settings/LanguagePreference";
import { ThemeToggle } from "@/components/settings/ThemeToggle";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { PrivacyDataSection } from "@/components/settings/PrivacyDataSection";
import { DangerZone } from "@/components/settings/DangerZone";
import { Globe, Sun, User, ShieldCheck, AlertTriangle } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto py-2">
      {/* Header */}
      <div className="border-b border-[#F0FDFA] dark:border-[#1E293B] pb-4">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
          Application Settings & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">
          Manage application language, display theme mode, profile account details, and data privacy
        </p>
      </div>

      {/* Main Grid: Desktop Left Anchor Nav (3 cols) + Right Settings Content (9 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Desktop Anchor Navigation Sidebar */}
        <div className="hidden lg:block lg:col-span-3 sticky top-24 bg-white dark:bg-[#0F172A] p-4 rounded-2xl border-2 border-[#F0FDFA] dark:border-[#1E293B] shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] px-2 mb-2 block">
            Settings Sections
          </span>
          <nav className="flex flex-col gap-1 text-xs font-semibold">
            <a
              href="#language"
              className="p-2.5 rounded-xl text-[#64748B] dark:text-[#94A3B8] hover:text-[#0D9488] dark:hover:text-[#14B8A6] hover:bg-[#F0FDFA]/50 dark:hover:bg-[#0D9488]/20 transition-colors flex items-center gap-2"
            >
              <Globe className="w-4 h-4 text-[#0D9488] dark:text-[#14B8A6]" />
              <span>Language Preference</span>
            </a>
            <a
              href="#theme"
              className="p-2.5 rounded-xl text-[#64748B] dark:text-[#94A3B8] hover:text-[#0D9488] dark:hover:text-[#14B8A6] hover:bg-[#F0FDFA]/50 dark:hover:bg-[#0D9488]/20 transition-colors flex items-center gap-2"
            >
              <Sun className="w-4 h-4 text-[#0D9488] dark:text-[#14B8A6]" />
              <span>Appearance & Theme</span>
            </a>
            <a
              href="#account"
              className="p-2.5 rounded-xl text-[#64748B] dark:text-[#94A3B8] hover:text-[#0D9488] dark:hover:text-[#14B8A6] hover:bg-[#F0FDFA]/50 dark:hover:bg-[#0D9488]/20 transition-colors flex items-center gap-2"
            >
              <User className="w-4 h-4 text-[#0D9488] dark:text-[#14B8A6]" />
              <span>Account Settings</span>
            </a>
            <a
              href="#privacy"
              className="p-2.5 rounded-xl text-[#64748B] dark:text-[#94A3B8] hover:text-[#0D9488] dark:hover:text-[#14B8A6] hover:bg-[#F0FDFA]/50 dark:hover:bg-[#0D9488]/20 transition-colors flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-[#0D9488] dark:text-[#14B8A6]" />
              <span>Privacy & Data Protection</span>
            </a>
            <a
              href="#danger"
              className="p-2.5 rounded-xl text-[#EF4444] hover:bg-[#FEF2F2] dark:hover:bg-[#450A0A] transition-colors flex items-center gap-2 mt-2 border-t border-[#F0FDFA] dark:border-[#1E293B] pt-3"
            >
              <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
              <span>Danger Zone</span>
            </a>
          </nav>
        </div>

        {/* Settings Sections Container */}
        <div className="lg:col-span-9 flex flex-col gap-8">
          <SettingsSection
            id="language"
            title="Language Preferences"
            description="Configure default application language for symptom checks and RAG queries"
            icon={<Globe className="w-5 h-5" />}
          >
            <LanguagePreference />
          </SettingsSection>

          <SettingsSection
            id="theme"
            title="Appearance & Theme Mode"
            description="Select Light, Dark, or System visual display mode"
            icon={<Sun className="w-5 h-5" />}
          >
            <ThemeToggle />
          </SettingsSection>

          <SettingsSection
            id="account"
            title="Account Information"
            description="Manage your profile full name, email address, and security password"
            icon={<User className="w-5 h-5" />}
          >
            <AccountSettings />
          </SettingsSection>

          <SettingsSection
            id="privacy"
            title="Data Export & Privacy Rights"
            description="Export your health data records and review PII privacy protections"
            icon={<ShieldCheck className="w-5 h-5" />}
          >
            <PrivacyDataSection />
          </SettingsSection>

          <SettingsSection
            id="danger"
            title="Danger Zone"
            description="Irreversible actions regarding your HealthCare Navigator account"
            icon={<AlertTriangle className="w-5 h-5 text-[#EF4444]" />}
            className="border-t-2 border-[#EF4444]/20 pt-4"
          >
            <DangerZone />
          </SettingsSection>
        </div>
      </div>
    </div>
  );
}
