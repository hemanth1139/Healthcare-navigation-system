"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import { StatusSummaryCard } from "@/components/dashboard/StatusSummaryCard";
import { RecentActivityList } from "@/components/dashboard/RecentActivityList";
import { Card } from "@/components/ui/Card";
import { MOCK_DASHBOARD_DATA } from "@/lib/mockData";
import { Sparkles, Calendar, ArrowRight } from "lucide-react";

export default function DashboardHomePage() {
  const { user } = useAuth();

  // Format today's date (e.g., Saturday, August 1, 2026)
  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* a. Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#1E2A2E] tracking-tight">
            Welcome back, {user?.fullName || "Patient"}
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6B6E] mt-0.5">
            Here is your health navigation dashboard and clinical status overview.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono font-medium text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 self-start sm:self-auto">
          <Calendar className="w-4 h-4" />
          <span>{todayDate}</span>
        </div>
      </div>

      {/* b. Status Summary Card */}
      <StatusSummaryCard status={MOCK_DASHBOARD_DATA.statusSummary} />

      {/* c. Quick Actions Row */}
      <div className="flex flex-col gap-3">
        <h2 className="font-heading font-bold text-base text-[#1E2A2E]">
          Quick Actions & Clinical Tools
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MOCK_DASHBOARD_DATA.quickActions.map((action) => (
            <QuickActionCard key={action.id} action={action} />
          ))}
        </div>
      </div>

      {/* d & e. Recent Activity & Health Tip Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
        {/* Recent Activity List (2 Columns on lg) */}
        <div className="lg:col-span-2">
          <RecentActivityList activities={MOCK_DASHBOARD_DATA.recentActivities} />
        </div>

        {/* Health Tip of the Day (1 Column on lg) */}
        <div className="lg:col-span-1">
          <Card className="bg-gradient-to-br from-blue-50/70 to-slate-50 border-2 border-blue-200 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 bg-white px-2.5 py-1 rounded-full border border-blue-200">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Tip of the Day
              </span>
              <span className="text-[11px] font-mono text-[#5C6B6E]">
                {MOCK_DASHBOARD_DATA.healthTip.readTime}
              </span>
            </div>

            <h2 className="font-heading font-bold text-base text-slate-900">
              {MOCK_DASHBOARD_DATA.healthTip.title}
            </h2>

            <p className="text-xs text-[#5C6B6E] leading-relaxed">
              {MOCK_DASHBOARD_DATA.healthTip.summary}
            </p>

            <div className="pt-2 border-t border-blue-100 mt-1">
              <Link
                href="/tips"
                className="inline-flex items-center text-xs font-semibold text-blue-600 hover:underline focus-ring rounded p-1 -ml-1 gap-1"
              >
                <span>Read health articles</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
