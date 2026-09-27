"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

interface GoogleSignInButtonProps {
  redirectUrl?: string;
  onError?: (err: string) => void;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  redirectUrl = "/dashboard",
  onError,
}) => {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  useEffect(() => {
    // 1. If script already loaded
    const winAny = typeof window !== "undefined" ? (window as any) : {};
    if (winAny.google?.accounts?.id) {
      setScriptLoaded(true);
      return;
    }

    // 2. Load Google Identity Services Script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => {
      console.warn("[GoogleAuth] Failed to load Google Identity Services script.");
    };
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    const winAny = typeof window !== "undefined" ? (window as any) : {};
    if (!scriptLoaded || !clientId || !winAny.google?.accounts?.id || !googleBtnContainerRef.current) {
      return;
    }

    try {
      winAny.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential: string }) => {
          if (!response.credential) {
            onError?.("Google authentication failed. No credentials returned.");
            return;
          }
          setLoading(true);
          try {
            await loginWithGoogle(response.credential, redirectUrl);
          } catch (err: any) {
            onError?.(err?.message || "Google Sign-In failed. Please try again.");
          } finally {
            setLoading(false);
          }
        },
      });

      // Render official Google button into container
      googleBtnContainerRef.current.innerHTML = "";
      winAny.google.accounts.id.renderButton(googleBtnContainerRef.current, {
        theme: "outline",
        size: "large",
        type: "standard",
        text: "continue_with",
        shape: "rectangular",
        width: googleBtnContainerRef.current.offsetWidth || 340,
        logo_alignment: "left",
      });
    } catch (e) {
      console.warn("[GoogleAuth] Initialization error:", e);
    }
  }, [scriptLoaded, clientId, loginWithGoogle, redirectUrl, onError]);

  const handleManualClick = () => {
    if (!clientId) {
      onError?.(
        "Google Client ID is missing. Please configure NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment."
      );
      return;
    }
    const winAny = typeof window !== "undefined" ? (window as any) : {};
    if (winAny.google?.accounts?.id) {
      winAny.google.accounts.id.prompt();
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Container for rendered Google GIS button */}
      <div
        ref={googleBtnContainerRef}
        className={`w-full flex justify-center ${!clientId ? "hidden" : ""}`}
      />

      {/* Fallback button if GIS button is rendering or clientId missing */}
      {(!clientId || !scriptLoaded || loading) && (
        <button
          type="button"
          onClick={handleManualClick}
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold flex items-center justify-center gap-3 transition-all shadow-xs disabled:opacity-60 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#0D9488]" />
              <span>Connecting with Google...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
