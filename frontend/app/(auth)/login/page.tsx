"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Lock, Mail, ArrowRight } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { Toast } from "@/components/ui/Toast";

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

export default function LoginPage() {
  const { login } = useAuth();
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
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    setGeneralError(null);
    try {
      await login(data);
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

      {/* Social Google Login */}
      <button
        type="button"
        onClick={() => {
          setGeneralError("Google OAuth sign-in is not configured. Please use email and password.");
        }}
        className="w-full mb-6 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 text-sm font-semibold flex items-center justify-center gap-3 transition-all shadow-sm"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
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
      </button>

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
              className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
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
          href="/register"
          className="font-bold text-[#0D9488] dark:text-[#14B8A6] hover:underline ml-1"
        >
          Create account
        </Link>
      </div>
    </div>
  );
}

