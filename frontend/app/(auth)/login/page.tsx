"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2 } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { Toast } from "@/components/ui/Toast";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email address is required")
    .email("Please enter a valid email address (e.g., patient@example.com)"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  const [showPassword, setShowPassword] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: {
      rememberMe: true,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setGeneralError(null);
    try {
      await login(data, redirectUrl);
    } catch (err: any) {
      setGeneralError(
        err?.message || "Incorrect email address or password. Please check your credentials."
      );
    }
  };

  return (
    <div className="flex flex-col">
      {/* Heading */}
      <div className="mb-6">
        <h1 className="font-heading font-bold text-3xl text-slate-900 dark:text-white tracking-tight">
          Welcome back
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Sign in to access your HealthNav AI medical portal.
        </p>
      </div>

      {/* Error Toast */}
      {generalError && (
        <div className="mb-5">
          <Toast
            type="error"
            title="Authentication Failed"
            message={generalError}
            onClose={() => setGeneralError(null)}
          />
        </div>
      )}

      {/* Quick Demo Login Credentials Card */}
      <div className="mb-5 p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D9488] dark:text-[#14B8A6] block">
            Pre-configured Demo Account
          </span>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Email: <strong className="text-slate-800 dark:text-slate-200 font-mono">sarah@example.com</strong> &bull; Password: <strong className="text-slate-800 dark:text-slate-200 font-mono">password123</strong>
          </p>
        </div>
        <button
          type="button"
          onClick={async () => {
            setGeneralError(null);
            try {
              await login({ email: "sarah@example.com", password: "password123" }, redirectUrl);
            } catch (err: any) {
              setGeneralError(err?.message || "Failed to sign in with demo credentials.");
            }
          }}
          className="px-3.5 py-1.5 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold shadow-sm transition-all whitespace-nowrap text-center cursor-pointer"
        >
          1-Click Sign In
        </button>
      </div>

      {/* Social Google Login Button */}
      <div className="mb-6">
        <GoogleSignInButton
          redirectUrl={redirectUrl}
          onError={(msg) => setGeneralError(msg)}
        />
      </div>

      <div className="relative flex items-center justify-center mb-6">
        <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
        <span className="bg-slate-50 dark:bg-[#030712] px-3 text-xs text-slate-400 font-medium uppercase absolute">
          Or sign in with email
        </span>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        {/* Email Field */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="email"
            className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
          >
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>Email Address</span>
          </label>
          <input
            id="email"
            type="email"
            placeholder="patient@example.com"
            autoComplete="email"
            className={`w-full text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border rounded-xl px-3.5 py-2.5 transition-colors focus:outline-none focus:ring-2 ${
              errors.email
                ? "border-rose-500 focus:ring-rose-200"
                : "border-slate-200 dark:border-slate-800 focus:border-[#0D9488] focus:ring-teal-500/20"
            }`}
            {...register("email")}
          />
          {errors.email && (
            <span className="text-xs text-rose-500 font-medium">{errors.email.message}</span>
          )}
        </div>

        {/* Password Field */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Password</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-[#0D9488] dark:text-[#14B8A6] hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <div className="relative flex items-center">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              className={`w-full text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border rounded-xl pl-3.5 pr-10 py-2.5 transition-colors focus:outline-none focus:ring-2 ${
                errors.password
                  ? "border-rose-500 focus:ring-rose-200"
                  : "border-slate-200 dark:border-slate-800 focus:border-[#0D9488] focus:ring-teal-500/20"
              }`}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <span className="text-xs text-rose-500 font-medium">{errors.password.message}</span>
          )}
        </div>

        {/* Remember me */}
        <div className="flex items-center gap-2 mt-1">
          <input
            id="rememberMe"
            type="checkbox"
            className="w-4 h-4 rounded text-[#0D9488] focus:ring-[#0D9488] border-slate-300 dark:border-slate-700 cursor-pointer"
            {...register("rememberMe")}
          />
          <label htmlFor="rememberMe" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
            Keep me signed in on this device
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-3 w-full bg-[#0D9488] hover:bg-[#0F766E] active:bg-[#115E59] text-white font-semibold py-3 rounded-xl shadow-md shadow-teal-500/25 transition-all text-sm cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <span>Signing in...</span>
          ) : (
            <>
              <span>Sign In to Portal</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Footer link */}
      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400">
        Don&apos;t have an account?{" "}
        <Link
          href={`/register${redirectUrl && redirectUrl !== "/dashboard" ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`}
          className="font-bold text-[#0D9488] dark:text-[#14B8A6] hover:underline ml-1"
        >
          Create account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center p-12 gap-3 min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#0D9488]" />
          <span className="text-xs text-slate-500">Loading sign-in...</span>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
