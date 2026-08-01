"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Lock, Eye, EyeOff, KeyRound, AlertTriangle, ArrowLeft } from "lucide-react";

import { authApi } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
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

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;
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
      setGeneralError(
        err?.response?.data?.message ||
          "Password reset failed. The link may be expired or invalid."
      );
    }
  };

  // If token is missing, render an explicit invalid token error view
  if (!token || token === "invalid" || token === "expired") {
    return (
      <div className="flex flex-col items-center text-center gap-5 py-2">
        <div className="w-14 h-14 rounded-full bg-[#FDF0EE] text-[#E5573F] flex items-center justify-center border-2 border-[#E5573F]/20">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-xl font-bold text-[#1E2A2E]">
            Invalid or Expired Reset Link
          </h1>
          <p className="text-sm text-[#5C6B6E] leading-relaxed">
            This password reset link is missing, corrupted, or has expired for security reasons.
          </p>
        </div>

        <div className="w-full flex flex-col gap-3 mt-2">
          <Link href="/forgot-password" className="w-full">
            <Button variant="urgent" size="md" fullWidth>
              Request New Reset Link
            </Button>
          </Link>
          <Link href="/login" className="w-full">
            <Button variant="ghost" size="md" fullWidth>
              Back to Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Heading */}
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-[#1E2A2E]">
          Set New Password
        </h1>
        <p className="text-sm text-[#5C6B6E]">
          Create a secure password with at least 8 characters and 1 number.
        </p>
      </div>

      {/* Success Notification */}
      {successNotice && (
        <Toast
          type="success"
          title="Password Reset Successful"
          message="Your password has been updated. Redirecting to login..."
        />
      )}

      {/* General Error Banner */}
      {generalError && (
        <Toast
          type="error"
          title="Reset Failed"
          message={generalError}
          onClose={() => setGeneralError(null)}
        />
      )}

      {/* Reset Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        {/* New Password */}
        <Input
          label="New Password"
          type={showPassword ? "text" : "password"}
          placeholder="At least 8 chars & 1 number"
          autoComplete="new-password"
          required
          leftIcon={<Lock className="w-4 h-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[#5C6B6E] hover:text-[#1E2A2E] p-1 rounded focus-ring"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          error={errors.newPassword?.message}
          {...register("newPassword")}
        />

        {/* Confirm New Password */}
        <Input
          label="Confirm New Password"
          type={showConfirmPassword ? "text" : "password"}
          placeholder="Re-enter new password"
          autoComplete="new-password"
          required
          leftIcon={<Lock className="w-4 h-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-[#5C6B6E] hover:text-[#1E2A2E] p-1 rounded focus-ring"
              aria-label={
                showConfirmPassword ? "Hide confirm password" : "Show confirm password"
              }
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          }
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
          disabled={!isValid && isSubmitting}
          className="mt-2"
        >
          <KeyRound className="w-5 h-5 mr-2" />
          Update Password
        </Button>
      </form>

      <div className="pt-2 border-t border-[#E6F4F3] text-center text-xs text-[#5C6B6E]">
        Remember your password?{" "}
        <Link
          href="/login"
          className="font-bold text-[#0F6E7A] hover:underline focus-ring rounded-sm px-1 py-0.5"
        >
          Back to Sign In
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
          <span className="text-xs text-[#5C6B6E]">Verifying token...</span>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
