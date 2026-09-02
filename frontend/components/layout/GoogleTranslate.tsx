"use client";

import React, { useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: any;
  }
}

export const GoogleTranslate: React.FC = () => {
  const { language } = useLanguage();

  useEffect(() => {
    const setGoogTransCookie = (targetLang: string) => {
      const host = window.location.hostname;
      const cookieVal = `/en/${targetLang}`;
      document.cookie = `googtrans=${cookieVal}; path=/; domain=${host}`;
      document.cookie = `googtrans=${cookieVal}; path=/`;
    };

    if (language === "ta") {
      setGoogTransCookie("ta");
    } else {
      setGoogTransCookie("en");
    }

    // Load Google Translate script
    if (!document.getElementById("google-translate-script")) {
      window.googleTranslateElementInit = () => {
        if (window.google && window.google.translate) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: "en",
              includedLanguages: "en,ta",
              layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
              autoDisplay: false,
            },
            "google_translate_element"
          );
        }
      };

      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    } else {
      const selectEl = document.querySelector(".goog-te-combo") as HTMLSelectElement;
      if (selectEl) {
        selectEl.value = language;
        selectEl.dispatchEvent(new Event("change"));
      }
    }
  }, [language]);

  return (
    <div className="hidden">
      <div id="google_translate_element" />
      <style jsx global>{`
        .goog-te-banner-frame, .goog-te-balloon-frame, #goog-gt-tt {
          display: none !important;
        }
        body {
          top: 0px !important;
        }
        .goog-te-gadget {
          display: none !important;
        }
      `}</style>
    </div>
  );
};
