"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  Stethoscope,
  AlertTriangle,
  UserCheck,
  Building2,
  ShieldAlert,
  FolderUp,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  ClipboardList,
} from "lucide-react";
import { UserMenu } from "./UserMenu";
import { useLanguage } from "@/context/LanguageContext";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Patient Profile", href: "/profile", icon: User },
  { label: "Symptom Chat", href: "/symptom-chat", icon: Stethoscope, badge: "AI" },
  { label: "Specialists", href: "/specialists", icon: UserCheck },
  { label: "Hospitals", href: "/hospitals", icon: Building2 },
  { label: "Government Schemes", href: "/schemes", icon: ShieldAlert },
  { label: "Consultation History", href: "/history", icon: ClipboardList },
  { label: "Scheme Documents", href: "/documents", icon: FolderUp },
  { label: "Health Tips", href: "/tips", icon: Sparkles },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const SIDEBAR_NAV_ITEMS: NavItem[] = NAV_ITEMS;

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { t } = useLanguage();

  const getTranslatedLabel = (href: string, defaultLabel: string) => {
    switch (href) {
      case "/dashboard": return t.dashboard;
      case "/profile": return t.patientProfile;
      case "/symptom-chat": return t.symptomChat;
      case "/history": return t.history;
      case "/schemes": return t.schemes;
      case "/documents": return t.documents;
      case "/hospitals": return t.hospitals;
      case "/specialists": return t.specialists;
      case "/tips": return t.tips;
      case "/settings": return t.settings;
      default: return defaultLabel;
    }
  };

  return (
    <aside
      className={`hidden md:flex flex-col h-screen sticky top-0 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-all duration-300 z-30 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Sidebar Header & Brand Logo */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 overflow-hidden focus-ring rounded-xl p-1"
        >
          <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
            <HeartPulse className="w-4.5 h-4.5 stroke-[2.5]" />
          </div>

          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="font-heading font-bold text-base text-slate-900 dark:text-white leading-tight tracking-tight">
                HealthCare<span className="text-teal-600 dark:text-teal-400">Nav</span>
              </span>
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                Clinical Portal
              </span>
            </div>
          )}
        </Link>

        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          type="button"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors focus-ring"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation Items List */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {SIDEBAR_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const translatedLabel = getTranslatedLabel(item.href, item.label);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? translatedLabel : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors duration-150 relative ${
                isActive
                  ? "bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200"
              } ${isCollapsed ? "justify-center" : ""}`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 ${
                  isActive ? "text-teal-600 dark:text-teal-400" : "text-slate-500 dark:text-slate-400"
                }`}
              />

              {!isCollapsed && (
                <span className="truncate flex-1">{translatedLabel}</span>
              )}

              {!isCollapsed && item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded-md bg-teal-600 text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom User Profile Section */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
        <UserMenu compact={isCollapsed} />
      </div>
    </aside>
  );
};
