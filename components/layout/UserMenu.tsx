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
        className={`flex items-center gap-2.5 p-1.5 rounded-xl transition-colors focus-ring cursor-pointer hover:bg-[#E6F4F3]/60 ${
          isOpen ? "bg-[#E6F4F3]" : ""
        }`}
      >
        <div className="w-9 h-9 rounded-xl bg-[#0F6E7A] text-white flex items-center justify-center font-heading font-semibold text-xs shadow-sm border border-white/20">
          {userInitials}
        </div>

        {!compact && (
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold text-[#1E2A2E] leading-snug line-clamp-1">
              {user?.fullName || "Patient Account"}
            </span>
            <span className="text-[11px] text-[#5C6B6E] line-clamp-1">
              {user?.email || "patient@example.com"}
            </span>
          </div>
        )}

        <ChevronDown className={`w-3.5 h-3.5 text-[#5C6B6E] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 bottom-full sm:bottom-auto sm:top-full mb-2 sm:mb-0 sm:mt-2 w-64 rounded-2xl bg-white shadow-[0_8px_24px_rgba(15,110,122,0.14)] border-2 border-[#E6F4F3] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Header section in dropdown */}
          <div className="px-4 py-3 border-b border-[#E6F4F3] flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-sm text-[#1E2A2E]">
                {user?.fullName || "Patient Account"}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#0F6E7A] bg-[#E6F4F3] px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3" /> Verified
              </span>
            </div>
            <span className="text-xs text-[#5C6B6E] font-mono truncate">
              {user?.email || "patient@example.com"}
            </span>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-[#1E2A2E] hover:bg-[#E6F4F3] transition-colors"
            >
              <UserIcon className="w-4 h-4 text-[#0F6E7A]" />
              <span>Patient Profile</span>
            </Link>

            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-[#1E2A2E] hover:bg-[#E6F4F3] transition-colors"
            >
              <Settings className="w-4 h-4 text-[#0F6E7A]" />
              <span>Account Settings</span>
            </Link>

            <button
              onClick={() => {
                setIsOpen(false);
                alert("HealthCare Navigator Support: Call 1-800-HEALTH-NAV or email support@healthcarenavigator.internal");
              }}
              role="menuitem"
              type="button"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-[#1E2A2E] hover:bg-[#E6F4F3] transition-colors text-left"
            >
              <HelpCircle className="w-4 h-4 text-[#0F6E7A]" />
              <span>Help & Support</span>
            </button>
          </div>

          {/* Logout Section */}
          <div className="pt-1 border-t border-[#E6F4F3]">
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
