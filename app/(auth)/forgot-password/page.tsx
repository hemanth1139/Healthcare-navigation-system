"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail, ArrowLeft, Send, CheckCircle2, RotateCw } from "lucide-react";

import { authApi } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
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
    formState: { errors, isSubmitting, isValid },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onBlur",
  });

  // Handle 30-second countdown timer for resend
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
      setGeneralError(
        err?.response?.data?.message || "Failed to send reset email. Please try again later."
      );
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
      setGeneralError("Failed to resend email. Please try again.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Back Button */}
      <div>
        <Link
          href="/login"
          className="inline-flex items-center text-xs font-semibold text-[#0F6E7A] hover:underline focus-ring rounded p-1 -ml-1 gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Sign In
        </Link>
      </div>

      {!submittedEmail ? (
        <>
          {/* Initial Form State */}
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-2xl font-bold text-[#1E2A2E]">
              Reset Password
            </h1>
            <p className="text-sm text-[#5C6B6E]">
              Enter your registered email address and we&apos;ll send you a link to reset your password.
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
              placeholder="sarah.jenkins@example.com"
              autoComplete="email"
              required
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register("email")}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              disabled={!isValid && isSubmitting}
            >
              <Send className="w-4 h-4 mr-2" />
              Send Reset Link
            </Button>
          </form>
        </>
      ) : (
        /* Confirmation State In-Page */
        <div className="flex flex-col items-center text-center gap-5 py-2">
          <div className="w-14 h-14 rounded-full bg-[#E6F4F3] text-[#0F6E7A] flex items-center justify-center border-2 border-[#0F6E7A]/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="font-heading text-xl font-bold text-[#1E2A2E]">
              Check Your Email
            </h2>
            <p className="text-sm text-[#5C6B6E] leading-relaxed">
              We have sent password reset instructions to:
            </p>
            <p className="font-mono font-medium text-sm text-[#0F6E7A] bg-[#E6F4F3] py-1.5 px-3 rounded-lg border border-[#0F6E7A]/20 inline-block mx-auto break-all">
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

          {generalError && (
            <Toast
              type="error"
              message={generalError}
              onClose={() => setGeneralError(null)}
            />
          )}

          <p className="text-xs text-[#5C6B6E]">
            Didn&apos;t receive the email? Check your spam folder or click below to resend.
          </p>

          <Button
            onClick={handleResend}
            variant="secondary"
            size="md"
            disabled={countdown > 0}
            fullWidth
            className="mt-1"
          >
            <RotateCw className={`w-4 h-4 mr-2 ${countdown > 0 ? "" : "group-hover:rotate-180 transition-transform"}`} />
            {countdown > 0 ? `Resend email in ${countdown}s` : "Resend Reset Email"}
          </Button>
        </div>
      )}
    </div>
  );
}
