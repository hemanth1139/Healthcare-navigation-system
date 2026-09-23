"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageCircle,
  Activity,
  Stethoscope,
  Building,
  FileText,
  Clock,
  Folder,
  HeartPulse,
  Upload,
  Settings,
  ChevronLeft,
  ChevronRight,
  User,
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
  { label: "Symptom Chat", href: "/symptom-chat", icon: MessageCircle, badge: "AI" },
  { label: "My Predictions", href: "/predictions", icon: Activity },
  { label: "Specialists", href: "/specialists", icon: Stethoscope },
  { label: "Hospitals", href: "/hospitals", icon: Building },
  { label: "Government Schemes", href: "/schemes", icon: FileText, badge: "RAG" },
  { label: "History", href: "/history", icon: Clock },
  { label: "Medical Records", href: "/records", icon: Folder },
  { label: "Health Tips", href: "/health-tips", icon: HeartPulse },
  { label: "Documents", href: "/documents", icon: Upload },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Patient Profile", href: "/profile", icon: User },
];

export const SIDEBAR_NAV_ITEMS: NavItem[] = NAV_ITEMS;

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Core Portal",
    items: [NAV_ITEMS[0], NAV_ITEMS[1], NAV_ITEMS[2]],
  },
  {
    title: "Clinical & Care",
    items: [NAV_ITEMS[3], NAV_ITEMS[4], NAV_ITEMS[5], NAV_ITEMS[6]],
  },
  {
    title: "Patient Data",
    items: [NAV_ITEMS[7], NAV_ITEMS[8], NAV_ITEMS[9], NAV_ITEMS[10], NAV_ITEMS[11]],
  },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { t } = useLanguage();

  const getTranslatedLabel = (href: string, defaultLabel: string) => {
    switch (href) {
      case "/dashboard": return t.dashboard || "Dashboard";
      case "/profile": return t.patientProfile || "Patient Profile";
      case "/symptom-chat": return t.symptomChat || "Symptom Chat";
      case "/history": return t.history || "History";
      case "/schemes": return t.schemes || "Government Schemes";
      case "/documents": return t.documents || "Documents";
      case "/hospitals": return t.hospitals || "Hospitals";
      case "/specialists": return t.specialists || "Specialists";
      case "/health-tips": return t.tips || "Health Tips";
      case "/settings": return t.settings || "Settings";
      default: return defaultLabel;
    }
  };

  return (
    <aside
      className={`hidden md:flex flex-col h-screen sticky top-0 bg-[#0B132B] dark:bg-[#030712] border-r border-slate-800 transition-all duration-300 z-30 ${
        isCollapsed ? "w-[76px]" : "w-64"
      }`}
    >
      {/* Sidebar Header & Brand Logo */}
      <div className="h-16 px-4 flex items-center justify-between shrink-0 border-b border-white/5">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 overflow-hidden focus-ring rounded-xl p-1"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0D9488] to-[#14B8A6] text-white flex items-center justify-center shrink-0 shadow-md shadow-teal-500/20">
            <HeartPulse className="w-5 h-5 stroke-[2.5]" />
          </div>

          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-heading font-bold text-base text-white leading-tight tracking-tight">
                HealthNav <span className="text-[#14B8A6]">AI</span>
              </span>
              <span className="text-[9px] text-slate-400 font-medium tracking-wider uppercase">Patient Portal</span>
            </div>
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
          className="mx-auto my-3 w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors focus-ring"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Navigation Items List — grouped sections */}
      <nav className="flex-1 py-3 px-3 space-y-5 overflow-y-auto custom-scrollbar">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="flex flex-col gap-1">
            {!isCollapsed && (
              <span className="px-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
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
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 relative ${
                    isActive
                      ? "bg-[#0D9488]/20 text-[#14B8A6] font-bold shadow-sm"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  } ${isCollapsed ? "justify-center" : ""}`}
                >
                  {isActive && !isCollapsed && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#14B8A6]" />
                  )}
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#14B8A6]" : "text-slate-400"}`} />

                  {!isCollapsed && <span className="truncate flex-1">{translatedLabel}</span>}

                  {!isCollapsed && item.badge && (
                    <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded-md bg-[#0D9488] text-white">
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

