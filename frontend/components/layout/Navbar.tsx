"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Menu, Globe, HeartPulse } from "lucide-react";
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

  const languages = ["English", "Tamil (தமிழ்)"];

  return (
    <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 h-16 px-4 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Left: Mobile Hamburger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileNav}
          type="button"
          aria-label="Open navigation menu"
          className="md:hidden p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 focus-ring transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="md:hidden w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-800 text-white flex items-center justify-center shadow-md">
            <HeartPulse className="w-5 h-5" />
          </div>
          <h1 className="font-heading font-bold text-lg sm:text-xl text-slate-900 dark:text-white">
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 transition-colors focus-ring"
          >
            <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">{language.split(" ")[0]}</span>
          </button>

          {isLangOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-in fade-in">
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    setLanguage(lang);
                    setIsLangOpen(false);
                  }}
                  type="button"
                  className={`w-full text-left px-3.5 py-2 text-xs transition-colors ${
                    language === lang
                      ? "bg-blue-50 dark:bg-blue-950/60 font-bold text-blue-600 dark:text-blue-400"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
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
          className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus-ring"
        >
          <Bell className="w-5 h-5" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
              {unreadNotifications}
            </span>
          )}
        </button>

        {/* User Avatar Menu Trigger */}
        <div className="border-l border-slate-200 dark:border-slate-800 pl-2 sm:pl-3">
          <UserMenu compact />
        </div>
      </div>
    </header>
  );
};
