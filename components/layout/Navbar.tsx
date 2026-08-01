"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Menu, Globe, HeartPulse, ShieldCheck } from "lucide-react";
import { UserMenu } from "./UserMenu";
import { NAV_ITEMS } from "./Sidebar";

export interface NavbarProps {
  onOpenMobileNav?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileNav }) => {
  const pathname = usePathname();
  const [language, setLanguage] = useState("English");
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3);

  // Dynamic route title calculation
  const getCurrentPageTitle = () => {
    const matched = NAV_ITEMS.find(
      (item) => item.href === pathname || (item.href !== "/dashboard" && pathname.startsWith(item.href))
    );
    return matched ? matched.label : "Healthcare Portal";
  };

  const languages = ["English", "Hindi (हिंदी)", "Bengali (বাংলা)", "Spanish (Español)"];

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-[#E6F4F3] h-16 px-4 sm:px-6 flex items-center justify-between shadow-sm">
      {/* Left: Mobile Hamburger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileNav}
          type="button"
          aria-label="Open navigation menu"
          className="md:hidden p-2 rounded-xl text-[#5C6B6E] hover:bg-[#E6F4F3] hover:text-[#0F6E7A] focus-ring transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="md:hidden w-8 h-8 rounded-lg bg-[#0F6E7A] text-white flex items-center justify-center">
            <HeartPulse className="w-4 h-4" />
          </div>
          <h1 className="font-heading font-bold text-lg sm:text-xl text-[#1E2A2E]">
            {getCurrentPageTitle()}
          </h1>
        </div>
      </div>

      {/* Right Controls: Language Selector, Notification Bell, User Menu */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Language Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsLangOpen(!isLangOpen)}
            type="button"
            aria-label="Select language"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#F7FAFA] hover:bg-[#E6F4F3] text-xs font-medium text-[#5C6B6E] hover:text-[#0F6E7A] border border-[#E6F4F3] transition-colors focus-ring"
          >
            <Globe className="w-4 h-4 text-[#0F6E7A]" />
            <span className="hidden sm:inline">{language.split(" ")[0]}</span>
          </button>

          {isLangOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-xl bg-white shadow-clinical-lg border border-[#E6F4F3] py-1 z-50">
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    setLanguage(lang);
                    setIsLangOpen(false);
                  }}
                  type="button"
                  className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                    language === lang
                      ? "bg-[#E6F4F3] font-bold text-[#0F6E7A]"
                      : "text-[#1E2A2E] hover:bg-[#F7FAFA]"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <button
          onClick={() => {
            alert(`You have ${unreadNotifications} unread clinical updates.`);
            setUnreadNotifications(0);
          }}
          type="button"
          aria-label="Notifications"
          className="relative p-2 rounded-xl text-[#5C6B6E] hover:bg-[#E6F4F3] hover:text-[#0F6E7A] transition-colors focus-ring"
        >
          <Bell className="w-5 h-5" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#E5573F] text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
              {unreadNotifications}
            </span>
          )}
        </button>

        {/* User Avatar Menu Trigger */}
        <div className="border-l border-[#E6F4F3] pl-2 sm:pl-3">
          <UserMenu compact />
        </div>
      </div>
    </header>
  );
};
