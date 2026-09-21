"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, Globe, ChevronDown } from "lucide-react";
import { UserMenu } from "./UserMenu";
import { NAV_ITEMS } from "./Sidebar";
import { useLanguage, Language } from "@/context/LanguageContext";

export interface NavbarProps {
  onOpenMobileNav?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileNav }) => {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();
  const [isLangOpen, setIsLangOpen] = useState(false);

  // Dynamic route title calculation
  const getCurrentPageTitle = () => {
    const matched = NAV_ITEMS.find(
      (item) => item.href === pathname || (item.href !== "/dashboard" && pathname.startsWith(item.href))
    );
    if (!matched) return t.portalTitle;

    switch (matched.href) {
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
      default: return matched.label;
    }
  };

  const languages: { id: Language; label: string; flag: string }[] = [
    { id: "en", label: "English", flag: "🇬🇧" },
    { id: "ta", label: "தமிழ் (Tamil)", flag: "🇮🇳" },
  ];

  return (
    <header className="sticky top-0 z-20 bg-[#F8FAFC]/95 dark:bg-[#020617]/95 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800/70 h-16 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Hamburger & Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileNav}
          type="button"
          aria-label="Open navigation menu"
          className="md:hidden p-2 -ml-1 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-teal-600 focus-ring transition-colors shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="font-heading font-bold text-lg sm:text-xl text-slate-900 dark:text-white truncate">
          {getCurrentPageTitle()}
        </h1>
      </div>

      {/* Right Controls: Language Selector, User Menu */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Language Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsLangOpen(!isLangOpen)}
            type="button"
            aria-label="Select language"
            className="flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors focus-ring"
          >
            <Globe className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span className="hidden sm:inline font-semibold">{language === "ta" ? "தமிழ்" : "English"}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${isLangOpen ? "rotate-180" : ""}`} />
          </button>

          {isLangOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-in fade-in">
              {languages.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => {
                    setLanguage(lang.id);
                    setIsLangOpen(false);
                  }}
                  type="button"
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                    language === lang.id
                      ? "bg-teal-50 dark:bg-teal-950/60 font-bold text-teal-600 dark:text-teal-400"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  }`}
                >
                  <span>{lang.label}</span>
                  <span className="text-sm">{lang.flag}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Avatar Menu Trigger */}
        <div className="border-l border-slate-200 dark:border-slate-800 pl-2 sm:pl-3">
          <UserMenu compact />
        </div>
      </div>
    </header>
  );
};
