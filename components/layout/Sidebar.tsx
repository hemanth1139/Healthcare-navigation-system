"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  Stethoscope,
  Activity,
  UserCheck,
  Building2,
  ShieldAlert,
  FileText,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
} from "lucide-react";
import { UserMenu } from "./UserMenu";

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
  { label: "Predictions & History", href: "/predictions", icon: Activity },
  { label: "Specialists", href: "/specialists", icon: UserCheck },
  { label: "Hospitals", href: "/hospitals", icon: Building2 },
  { label: "Government Schemes", href: "/schemes", icon: ShieldAlert },
  { label: "Medical Records", href: "/records", icon: FileText },
  { label: "Health Tips", href: "/tips", icon: Sparkles },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-800 text-white flex items-center justify-center shrink-0 shadow-md">
            <HeartPulse className="w-5 h-5 stroke-[2.5]" />
          </div>

          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="font-heading font-bold text-base text-slate-900 dark:text-white leading-tight tracking-tight">
                HealthCare<span className="text-blue-600 dark:text-blue-400">Nav</span>
              </span>
              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 tracking-wider uppercase">
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
          className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors focus-ring"
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
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 relative ${
                isActive
                  ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold border-l-4 border-blue-600 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200"
              } ${isCollapsed ? "justify-center" : ""}`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 ${
                  isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
                }`}
              />

              {!isCollapsed && (
                <span className="truncate flex-1">{item.label}</span>
              )}

              {!isCollapsed && item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded-md bg-gradient-to-r from-blue-600 to-blue-800 text-white">
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
