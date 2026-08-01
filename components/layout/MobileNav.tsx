"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Stethoscope,
  Activity,
  Building2,
  User,
  MoreHorizontal,
  X,
  HeartPulse,
} from "lucide-react";
import { NAV_ITEMS } from "./Sidebar";

export interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();

  // Close drawer automatically on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Primary 5 bottom tab bar items
  const primaryTabs = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Symptom Chat", href: "/symptom-chat", icon: Stethoscope },
    { label: "Predictions", href: "/predictions", icon: Activity },
    { label: "Hospitals", href: "/hospitals", icon: Building2 },
    { label: "Profile", href: "/profile", icon: User },
  ];

  return (
    <>
      {/* 1. Slide-out Drawer (All Navigation Modules) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop Overlay */}
          <div
            onClick={onClose}
            className="fixed inset-0 bg-[#1E2A2E]/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-250">
            {/* Drawer Header */}
            <div className="h-16 px-4 flex items-center justify-between border-b border-[#E6F4F3]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0F6E7A] text-white flex items-center justify-center">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <span className="font-heading font-bold text-base text-[#1E2A2E]">
                  HealthCare<span className="text-[#0F6E7A]">Nav</span>
                </span>
              </div>

              <button
                onClick={onClose}
                type="button"
                aria-label="Close navigation drawer"
                className="p-2 rounded-xl text-[#5C6B6E] hover:bg-[#E6F4F3] hover:text-[#1E2A2E] focus-ring"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Complete Module Links List */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
              <span className="px-3 text-[10px] font-semibold text-[#5C6B6E] uppercase tracking-wider">
                Clinical Modules
              </span>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-[#E6F4F3] text-[#0F6E7A] font-bold border-l-4 border-[#0F6E7A]"
                        : "text-[#1E2A2E] hover:bg-[#F7FAFA]"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isActive ? "text-[#0F6E7A]" : "text-[#5C6B6E]"
                      }`}
                    />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-[#0F6E7A] text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-[#E6F4F3] bg-[#F7FAFA] text-xs text-[#5C6B6E] text-center">
              HealthCare Navigator &copy; {new Date().getFullYear()}
            </div>
          </div>
        </div>
      )}

      {/* 2. Fixed Mobile Bottom Tab Bar (sm and below) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E6F4F3] shadow-[0_-2px_10px_rgba(15,110,122,0.06)] px-2 py-1.5 flex items-center justify-around"
      >
        {primaryTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            pathname === tab.href ||
            (tab.href !== "/dashboard" && pathname.startsWith(tab.href));

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-1 min-w-[60px] py-1 px-2 rounded-xl transition-all ${
                isActive ? "text-[#0F6E7A] font-semibold" : "text-[#5C6B6E]"
              }`}
            >
              <div
                className={`p-1 rounded-lg transition-colors ${
                  isActive ? "bg-[#E6F4F3]" : "bg-transparent"
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] leading-none tracking-tight">{tab.label}</span>
            </Link>
          );
        })}

        {/* More Button */}
        <button
          onClick={() => (isOpen ? onClose() : onClose())}
          type="button"
          onClickCapture={() => {
            if (!isOpen) {
              // Trigger parent toggle
            }
          }}
          className="flex flex-col items-center justify-center gap-1 min-w-[60px] py-1 px-2 text-[#5C6B6E]"
        >
          <div className="p-1 rounded-lg">
            <MoreHorizontal className="w-5 h-5" />
          </div>
          <span className="text-[10px] leading-none tracking-tight">More</span>
        </button>
      </nav>
    </>
  );
};
