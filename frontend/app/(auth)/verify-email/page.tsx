"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, AlertTriangle, ArrowRight, Loader2, MailCheck } from "lucide-react";
import { api } from "@/lib/api";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [status, setStatus] = useState<"loading" | "success" | "error">(token ? "loading" : "error");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing from the link.");
      return;
    }

    const verify = async () => {
      try {
        const res = await api.post("/auth/verify-email", { token });
        setStatus("success");
        setMessage(res.data?.message || "Your email has been verified successfully.");
      } catch (err: any) {
        setStatus("error");
        setMessage(
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "The email verification link is invalid or has expired."
        );
      }
    };

    verify();
  }, [token]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center text-center gap-4 py-8">
        <Loader2 className="w-12 h-12 animate-spin text-[#0D9488]" />
        <h2 className="font-heading text-xl font-bold text-slate-900 dark:text-slate-100">
          Verifying Your Email...
        </h2>
        <p className="text-xs text-slate-500">Please wait while we confirm your account security credentials.</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center text-center gap-5 py-6">
        <div className="w-16 h-16 rounded-3xl bg-teal-500/10 text-[#0D9488] flex items-center justify-center shadow-inner">
          <MailCheck className="w-8 h-8" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-slate-100">
            Email Verified Successfully!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {message}
          </p>
        </div>
        <Link
          href="/login"
          className="w-full mt-2 py-3 px-4 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md shadow-teal-500/20 transition-all"
        >
          <span>Continue to Sign In</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center gap-5 py-6">
      <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-600 flex items-center justify-center shadow-inner">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <div>
        <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-slate-100">
          Verification Link Expired
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
          {message}
        </p>
      </div>
      <div className="w-full flex flex-col gap-2 mt-2">
        <Link
          href="/login"
          className="w-full py-3 px-4 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-teal-500/20"
        >
          <span>Back to Sign In</span>
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center p-12 gap-3 min-h-[250px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#0D9488]" />
          <span className="text-xs text-slate-500">Verifying security token...</span>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
