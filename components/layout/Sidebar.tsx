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
      className={`hidden md:flex flex-col h-screen sticky top-0 bg-white border-r border-[#E6F4F3] transition-all duration-300 z-30 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Sidebar Header & Brand Logo */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[#E6F4F3]">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 overflow-hidden focus-ring rounded-xl p-1"
        >
          <div className="w-10 h-10 rounded-xl bg-[#0F6E7A] text-white flex items-center justify-center shrink-0 shadow-sm">
            <HeartPulse className="w-5 h-5 stroke-[2.5]" />
          </div>

          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="font-heading font-bold text-base text-[#1E2A2E] leading-tight tracking-tight">
                HealthCare<span className="text-[#0F6E7A]">Nav</span>
              </span>
              <span className="text-[10px] font-semibold text-[#5C6B6E] tracking-wider uppercase">
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
          className="w-7 h-7 rounded-lg bg-[#E6F4F3] hover:bg-[#D4ECE9] text-[#0F6E7A] flex items-center justify-center transition-colors focus-ring"
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
                  ? "bg-[#E6F4F3] text-[#0F6E7A] font-semibold border-l-4 border-[#0F6E7A] shadow-sm"
                  : "text-[#5C6B6E] hover:bg-[#E6F4F3]/50 hover:text-[#1E2A2E]"
              } ${isCollapsed ? "justify-center" : ""}`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 ${
                  isActive ? "text-[#0F6E7A]" : "text-[#5C6B6E]"
                }`}
              />

              {!isCollapsed && (
                <span className="truncate flex-1">{item.label}</span>
              )}

              {!isCollapsed && item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded-md bg-[#0F6E7A] text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom User Profile Section */}
      <div className="p-3 border-t border-[#E6F4F3] bg-[#F7FAFA]/60">
        <UserMenu compact={isCollapsed} />
      </div>
    </aside>
  );
};
