"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail, ArrowLeft, Send, CheckCircle2, RotateCw } from "lucide-react";

import { authApi } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email address is required")
    .email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onBlur",
  });

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setGeneralError(null);
    try {
      await authApi.forgotPassword({ email: data.email });
      setSubmittedEmail(data.email);
      setCountdown(30);
    } catch (err: any) {
      setGeneralError(err?.message || "Failed to dispatch reset link. Please check your email and try again.");
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || !submittedEmail) return;
    setGeneralError(null);
    setResendNotice(null);
    try {
      await authApi.forgotPassword({ email: submittedEmail });
      setCountdown(30);
      setResendNotice("A new reset link has been dispatched to your email address.");
    } catch (err: any) {
      setGeneralError(err?.message || "Failed to resend reset link.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/login"
          className="inline-flex items-center text-xs font-semibold text-[#0D9488] dark:text-[#14B8A6] hover:underline gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Login</span>
        </Link>
      </div>

      {!submittedEmail ? (
        <>
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Reset Password
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Enter your registered email address to receive password reset instructions.
            </p>
          </div>

          {generalError && (
            <Toast
              type="error"
              title="Request Failed"
              message={generalError}
              onClose={() => setGeneralError(null)}
            />
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
            <Input
              label="Registered Email Address"
              type="email"
              placeholder="patient@example.com"
              autoComplete="email"
              required
              leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
              error={errors.email?.message}
              {...register("email")}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold py-3 rounded-xl shadow-md shadow-teal-500/25 transition-all text-sm cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Send Reset Link</span>
            </button>
          </form>
        </>
      ) : (
        <div className="flex flex-col items-center text-center gap-5 py-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/10 text-[#0D9488] dark:text-[#14B8A6] flex items-center justify-center border border-teal-500/20 shadow-md">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
              Check Your Email
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              We have dispatched password reset instructions to:
            </p>
            <p className="font-mono font-semibold text-sm text-[#0D9488] dark:text-[#14B8A6] bg-teal-50 dark:bg-teal-950/50 py-1.5 px-3 rounded-lg border border-teal-500/20 inline-block mx-auto break-all">
              {submittedEmail}
            </p>
          </div>

          {resendNotice && (
            <Toast
              type="success"
              message={resendNotice}
              onClose={() => setResendNotice(null)}
            />
          )}

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Didn&apos;t receive the email? Check your spam folder or resend.
          </p>

          <button
            onClick={handleResend}
            disabled={countdown > 0}
            className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <RotateCw className="w-4 h-4" />
            <span>{countdown > 0 ? `Resend email in ${countdown}s` : "Resend Reset Email"}</span>
          </button>
        </div>
      )}
    </div>
  );
}

