"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import { RecentActivityList } from "@/components/dashboard/RecentActivityList";
import { SeverityUrgencyCard } from "@/components/assessment/SeverityUrgencyCard";
import { Card } from "@/components/ui/Card";
import { MOCK_DASHBOARD_DATA } from "@/lib/mockData";
import { MOCK_ASSESSMENTS, MOCK_SPECIALIST_RECOMMENDATIONS } from "@/lib/mockAssessmentData";
import {
  Sparkles,
  Calendar,
  ArrowRight,
  Stethoscope,
  Building2,
  ShieldAlert,
  FolderUp,
  ClipboardList,
} from "lucide-react";

export default function DashboardHomePage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  // Format today's date
  const todayDate = new Date().toLocaleDateString(language === "ta" ? "ta-IN" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Latest assessment — NON_URGENT example for dashboard
  const latestAssessment = MOCK_ASSESSMENTS[2];
  const latestSpecialist = MOCK_SPECIALIST_RECOMMENDATIONS[2];

  // Phase 1 Quick Actions
  const quickActions = [
    {
      id: "act_1",
      title: language === "ta" ? "அறிகுறி சோதனையைத் தொடங்குங்கள்" : "Start Symptom Check",
      description: language === "ta" ? "Gemini 2.5 Flash மூலம் இயங்கும் AI உரையாடல் ஆய்வு." : "Multi-turn AI intake powered by Gemini 2.5 Flash.",
      iconName: "Stethoscope" as const,
      linkUrl: "/symptom-chat",
      badgeText: "AI",
      isPrimary: true,
    },
    {
      id: "act_2",
      title: language === "ta" ? "திட்ட தகுதியை சரிபார்க்கவும்" : "Check Scheme Eligibility",
      description: language === "ta" ? "அரசு சுகாதார காப்பீட்டு திட்டங்களின் RAG தகுதி ஆய்வு." : "RAG-powered government healthcare scheme eligibility.",
      iconName: "ShieldAlert" as const,
      linkUrl: "/schemes",
    },
    {
      id: "act_3",
      title: language === "ta" ? "மருத்துவமனையைக் கண்டறியவும்" : "Find Nearby Hospital",
      description: language === "ta" ? "அருகிலுள்ள அவசர மற்றும் சிறப்பு மருத்துவமனைகள்." : "Locate hospitals by specialist type and location.",
      iconName: "Building2" as const,
      linkUrl: "/hospitals",
    },
    {
      id: "act_4",
      title: language === "ta" ? "ஆவணங்களைப் பதிவேற்றுங்கள்" : "Upload Scheme Documents",
      description: language === "ta" ? "தகுதி ஆவணங்களை பதிவேற்றி சரிபார்க்கவும்." : "Upload eligibility certificates for scheme assessment.",
      iconName: "FileUp" as const,
      linkUrl: "/documents",
    },
  ];

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
            {t.welcomeBack}, {user?.fullName || (language === "ta" ? "நோயாளி" : "Patient")}
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            {t.dashboardSub}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono font-medium text-teal-700 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200 self-start sm:self-auto">
          <Calendar className="w-4 h-4" />
          <span>{todayDate}</span>
        </div>
      </div>

      {/* Latest Severity & Urgency Assessment */}
      {latestAssessment && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-base text-[#0F172A]">
              {t.latestAssessment}
            </h2>
            <Link
              href="/history"
              className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:underline"
            >
              {t.viewAllConsultations}
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <SeverityUrgencyCard
            assessment={latestAssessment}
            specialist={latestSpecialist}
            compact={false}
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-col gap-3">
        <h2 className="font-heading font-bold text-base text-[#0F172A]">
          {t.quickActionsTitle}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <QuickActionCard key={action.id} action={action} />
          ))}
        </div>
      </div>

      {/* Recent Activity & Health Tip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
        {/* Recent Activity (2 columns on lg) */}
        <div className="lg:col-span-2">
          <RecentActivityList activities={MOCK_DASHBOARD_DATA.recentActivities} />
        </div>

        {/* Side Column: Health Tip + Quick Links */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          {/* Health Tip */}
          <Card className="bg-gradient-to-br from-teal-50/70 to-slate-50 border-2 border-teal-200 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-600 bg-white px-2.5 py-1 rounded-full border border-teal-200">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" /> {t.tipOfTheDay}
              </span>
              <span className="text-[11px] font-mono text-[#64748B]">
                {MOCK_DASHBOARD_DATA.healthTip.readTime}
              </span>
            </div>

            <h2 className="font-heading font-bold text-base text-slate-900">
              {language === "ta" ? "நீரிழிவு நோயில் நீரேற்றத்தின் முக்கியத்துவம்" : MOCK_DASHBOARD_DATA.healthTip.title}
            </h2>

            <p className="text-xs text-[#64748B] leading-relaxed">
              {language === "ta" ? "அதிக இரத்த சர்க்கரை நீரிழப்பை ஏற்படுத்தக்கூடும். தினமும் 8-10 டம்ளர் தண்ணீர் குடிப்பது சிறுநீரகங்களை பாதுகாக்கும்." : MOCK_DASHBOARD_DATA.healthTip.summary}
            </p>

            <div className="pt-2 border-t border-teal-100 mt-1">
              <Link
                href="/tips"
                className="inline-flex items-center text-xs font-semibold text-teal-600 hover:underline focus-ring rounded p-1 -ml-1 gap-1"
              >
                <span>{language === "ta" ? "அனைத்து குறிப்புகளையும் காண்க" : "View all health tips"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>

          {/* Phase 1 Quick Access Links */}
          <Card className="p-4 flex flex-col gap-2 border border-slate-200">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              {t.quickAccess}
            </p>
            {[
              { label: t.history, href: "/history", icon: ClipboardList },
              { label: t.schemes, href: "/schemes", icon: ShieldAlert },
              { label: t.documents, href: "/documents", icon: FolderUp },
              { label: t.specialists, href: "/specialists", icon: Stethoscope },
              { label: t.hospitals, href: "/hospitals", icon: Building2 },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-teal-50 text-xs font-medium text-slate-700 hover:text-teal-700 transition-colors"
                >
                  <Icon className="w-4 h-4 text-slate-400" />
                  {item.label}
                  <ArrowRight className="w-3 h-3 ml-auto text-slate-300" />
                </Link>
              );
            })}
          </Card>
        </div>
      </div>
    </div>
  );
}
