"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { User as UserIcon, Settings, HelpCircle, LogOut, ShieldCheck, ChevronDown } from "lucide-react";

export interface UserMenuProps {
  compact?: boolean;
}

export const UserMenu: React.FC<UserMenuProps> = ({ compact = false }) => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return "HN";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const userInitials = getInitials(user?.fullName || user?.email);

  return (
    <div ref={menuRef} className="relative inline-block text-left">
      {/* Avatar Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User account menu"
        className={`flex items-center gap-2.5 p-1.5 rounded-xl transition-colors focus-ring cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/40 ${
          isOpen ? "bg-blue-50 dark:bg-blue-950/60" : ""
        }`}
      >
        <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-heading font-semibold text-xs shadow-sm border border-white/20">
          {userInitials}
        </div>

        {!compact && (
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-900 dark:text-white leading-snug line-clamp-1">
              {user?.fullName || "Patient Account"}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
              {user?.email || "patient@example.com"}
            </span>
          </div>
        )}

        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 bottom-full sm:bottom-auto sm:top-full mb-2 sm:mb-0 sm:mt-2 w-64 rounded-2xl bg-white dark:bg-slate-800 shadow-clinical-lg border border-slate-200 dark:border-slate-700 py-2 z-50 animate-fadeIn"
        >
          {/* Header section in dropdown */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                {user?.fullName || "Patient Account"}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3" /> Verified
              </span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
              {user?.email || "patient@example.com"}
            </span>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
            >
              <UserIcon className="w-4 h-4 text-blue-600" />
              <span>Patient Profile</span>
            </Link>

            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
            >
              <Settings className="w-4 h-4 text-blue-600" />
              <span>Account Settings</span>
            </Link>

            <button
              onClick={() => {
                setIsOpen(false);
                alert("HealthCare Navigator Support: Call 1-800-HEALTH-NAV or email support@healthcarenavigator.internal");
              }}
              role="menuitem"
              type="button"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors text-left"
            >
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span>Help & Support</span>
            </button>
          </div>

          {/* Logout Section */}
          <div className="pt-1 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              role="menuitem"
              type="button"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-[#E5573F] hover:bg-[#FDF0EE] transition-colors text-left"
            >
              <LogOut className="w-4 h-4 text-[#E5573F]" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
