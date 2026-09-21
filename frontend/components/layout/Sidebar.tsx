"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  Stethoscope,
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

// Grouped sections for a clearer information hierarchy in the sidebar
const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [NAV_ITEMS[0], NAV_ITEMS[1]],
  },
  {
    title: "Care",
    items: [NAV_ITEMS[2], NAV_ITEMS[3], NAV_ITEMS[4], NAV_ITEMS[6]],
  },
  {
    title: "Support",
    items: [NAV_ITEMS[5], NAV_ITEMS[7], NAV_ITEMS[8]],
  },
];

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
      className={`hidden md:flex flex-col h-screen sticky top-0 bg-[#0B1220] transition-all duration-300 z-30 ${
        isCollapsed ? "w-[76px]" : "w-64"
      }`}
    >
      {/* Sidebar Header & Brand Logo */}
      <div className="h-16 px-4 flex items-center justify-between shrink-0">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 overflow-hidden focus-ring rounded-xl p-1"
        >
          <div className="w-9 h-9 rounded-xl bg-teal-500 text-white flex items-center justify-center shrink-0">
            <HeartPulse className="w-4.5 h-4.5 stroke-[2.5]" />
          </div>

          {!isCollapsed && (
            <span className="font-heading font-bold text-base text-white leading-tight tracking-tight truncate">
              MediNav
            </span>
          )}
        </Link>

        {/* Collapse Toggle Button */}
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            type="button"
            aria-label="Collapse sidebar"
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors focus-ring"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          type="button"
          aria-label="Expand sidebar"
          className="mx-auto mb-2 w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors focus-ring"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Navigation Items List — grouped sections */}
      <nav className="flex-1 py-2 px-3 space-y-5 overflow-y-auto custom-scrollbar">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="flex flex-col gap-1">
            {!isCollapsed && (
              <span className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {group.title}
              </span>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const translatedLabel = getTranslatedLabel(item.href, item.label);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isCollapsed ? translatedLabel : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors duration-150 relative ${
                    isActive
                      ? "bg-teal-500/15 text-teal-300 font-semibold"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                  } ${isCollapsed ? "justify-center" : ""}`}
                >
                  {isActive && !isCollapsed && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-teal-400" />
                  )}
                  <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? "text-teal-300" : "text-slate-500"}`} />

                  {!isCollapsed && <span className="truncate flex-1">{translatedLabel}</span>}

                  {!isCollapsed && item.badge && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-md bg-teal-500 text-[#0B1220]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom User Profile Section */}
      <div className="p-3 border-t border-white/5">
        <UserMenu compact={isCollapsed} dark />
      </div>
    </aside>
  );
};
