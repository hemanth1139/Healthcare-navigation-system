"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Lock, Eye, EyeOff, KeyRound, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";

import { authApi } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(1, "New password is required")
      .min(8, "Password must be at least 8 characters")
      .regex(/.*[0-9].*/, "Password must contain at least 1 number"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function getPasswordStrength(password: string): { label: string; color: string; percent: number } {
  if (!password) return { label: "", color: "bg-slate-200", percent: 0 };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { label: "Weak password", color: "bg-rose-500", percent: 25 };
  if (score === 2 || score === 3) return { label: "Medium strength", color: "bg-amber-500", percent: 65 };
  return { label: "Strong password", color: "bg-emerald-500", percent: 100 };
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
  });

  const watchPassword = watch("newPassword", "");
  const strength = getPasswordStrength(watchPassword);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setGeneralError(null);
    try {
      await authApi.resetPassword({
        token: token,
        newPassword: data.newPassword,
      });
      setSuccessNotice(true);
      setTimeout(() => {
        router.push("/login?reset=success");
      }, 2000);
    } catch (err: any) {
      setGeneralError(err?.message || "Password reset failed. Please ensure the reset link is valid.");
    }
  };

  if (token === "invalid" || token === "expired") {
    return (
      <div className="flex flex-col items-center text-center gap-5 py-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20 shadow-md">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
            Invalid or Expired Link
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            This password reset link is missing or has expired for security reasons.
          </p>
        </div>

        <div className="w-full flex flex-col gap-3 mt-2">
          <Link
            href="/forgot-password"
            className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm transition-all"
          >
            Request New Reset Link
          </Link>
          <Link
            href="/login"
            className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Set New Password
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Create a strong password with at least 8 characters and 1 number.
        </p>
      </div>

      {successNotice && (
        <Toast
          type="success"
          title="Password Reset!"
          message="Your password has been updated. Redirecting to login..."
        />
      )}

      {generalError && (
        <Toast
          type="error"
          title="Reset Failed"
          message={generalError}
          onClose={() => setGeneralError(null)}
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Input
            label="New Password"
            type={showPassword ? "text" : "password"}
            placeholder="At least 8 chars & 1 number"
            autoComplete="new-password"
            required
            leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            error={errors.newPassword?.message}
            {...register("newPassword")}
          />

          {watchPassword && (
            <div className="flex flex-col gap-1 mt-1">
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${strength.color} transition-all duration-300`}
                  style={{ width: `${strength.percent}%` }}
                />
              </div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {strength.label}
              </span>
            </div>
          )}
        </div>

        <Input
          label="Confirm New Password"
          type={showConfirmPassword ? "text" : "password"}
          placeholder="Re-enter new password"
          autoComplete="new-password"
          required
          leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 w-full bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold py-3 rounded-xl shadow-md shadow-teal-500/25 transition-all text-sm cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <span>Updating password...</span>
          ) : (
            <>
              <KeyRound className="w-4 h-4" />
              <span>Update Password</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400">
        Remember your password?{" "}
        <Link
          href="/login"
          className="font-bold text-[#0D9488] dark:text-[#14B8A6] hover:underline ml-1"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center p-8 gap-3">
          <Spinner size="lg" color="primary" />
          <span className="text-xs text-slate-500">Verifying security token...</span>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

