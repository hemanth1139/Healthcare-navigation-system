"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Globe, ChevronDown, Bell, Search, Sun, Moon, CheckCircle, ShieldAlert, Sparkles, ChevronRight } from "lucide-react";
import { UserMenu } from "./UserMenu";
import { NAV_ITEMS } from "./Sidebar";
import { useLanguage, Language } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";

export interface NavbarProps {
  onOpenMobileNav?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileNav }) => {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  interface NotificationItem {
    id: number;
    title: string;
    time: string;
    icon: any;
    color: string;
  }

  const notifs: NotificationItem[] = [];

  const getCurrentPageTitle = () => {
    const matched = NAV_ITEMS.find(
      (item) => item.href === pathname || (item.href !== "/dashboard" && pathname.startsWith(item.href))
    );
    if (!matched) return "Portal";
    return matched.label;
  };

  const breadcrumbItems = pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).replace("-", " "));

  const languages: { id: Language; label: string; flag: string }[] = [
    { id: "en", label: "English", flag: "🇮🇳" },
    { id: "ta", label: "தமிழ் (Tamil)", flag: "🇮🇳" },
  ];

  return (
    <header className="sticky top-0 z-20 glass-panel border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 flex flex-col justify-center min-h-[64px] py-2">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Hamburger & Page Title + Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileNav}
            type="button"
            aria-label="Open navigation menu"
            className="md:hidden p-2 -ml-1 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus-ring transition-colors shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex flex-col min-w-0">
            {/* Breadcrumb Trail */}
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              <Link href="/dashboard" className="hover:text-[#0D9488] transition-colors">Home</Link>
              {breadcrumbItems.map((b, i) => (
                <React.Fragment key={i}>
                  <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                  <span className={i === breadcrumbItems.length - 1 ? "text-slate-700 dark:text-slate-300 font-semibold" : ""}>{b}</span>
                </React.Fragment>
              ))}
            </div>

            <h1 className="font-heading font-bold text-lg sm:text-xl text-slate-900 dark:text-white truncate">
              {getCurrentPageTitle()}
            </h1>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="hidden md:flex flex-1 max-w-xs mx-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search symptoms, hospitals, schemes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs text-slate-900 dark:text-slate-100 bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#0D9488]"
          />
        </div>

        {/* Right Controls: Theme Toggle, Notifications, Language, User Dropdown */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            type="button"
            aria-label="Toggle dark mode"
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus-ring"
          >
            {theme === "dark" ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-slate-600" />}
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              type="button"
              aria-label="Notifications"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus-ring relative"
            >
              <Bell className="w-4.5 h-4.5" />
              {notifs.length > 0 && (
                <>
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
                </>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 py-3 px-4 z-50 animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-heading font-bold text-xs text-slate-900 dark:text-white">Notifications</span>
                  {notifs.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-[#0D9488]">
                      {notifs.length} New
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-2 mt-2">
                  {notifs.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No new notifications
                    </div>
                  ) : (
                    notifs.map((n) => (
                      <div key={n.id} className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors">
                        <n.icon className={`w-4 h-4 mt-0.5 ${n.color}`} />
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{n.title}</span>
                          <span className="text-[10px] text-slate-400">{n.time}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              type="button"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-[#0D9488]" />
              <span className="hidden sm:inline text-xs">{language === "ta" ? "தமிழ்" : "EN"}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isLangOpen ? "rotate-180" : ""}`} />
            </button>

            {isLangOpen && (
              <div className="absolute right-0 mt-2 w-36 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 z-50">
                {languages.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => {
                      setLanguage(lang.id);
                      setIsLangOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between ${
                      language === lang.id ? "font-bold text-[#0D9488]" : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    <span>{lang.label}</span>
                    <span>{lang.flag}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Menu Trigger */}
          <div className="border-l border-slate-200 dark:border-slate-800 pl-2">
            <UserMenu compact />
          </div>
        </div>
      </div>
    </header>
  );
};

