"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { Toast } from "@/components/ui/Toast";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email address is required")
    .email("Please enter a valid email address (e.g., user@example.com)"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
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
      {/* Centered Heading & Subtitle */}
      <div className="text-center mb-6">
        <h1 className="font-heading font-bold text-2xl sm:text-[28px] text-slate-900 dark:text-white tracking-tight">
          Welcome back
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1.5">
          Please enter your details to sign in.
        </p>
      </div>

      {/* General Error Banner */}
      {generalError && (
        <div className="mb-4">
          <Toast
            type="error"
            title="Authentication Failed"
            message={generalError}
            onClose={() => setGeneralError(null)}
          />
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        {/* Username / Email Field */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="email"
            className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
          >
            USERNAME OR EMAIL
          </label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            autoComplete="email"
            className={`w-full text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-[#1E293B] placeholder:text-slate-400 border rounded-xl px-4 py-3 transition-all duration-200 focus:outline-none ${
              errors.email
                ? "border-rose-500 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                : "border-slate-200 dark:border-slate-700 hover:border-slate-300 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/10"
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
              className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
            >
              PASSWORD
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-[#2563EB] hover:underline"
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
              className={`w-full text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-[#1E293B] placeholder:text-slate-400 border rounded-xl pl-4 pr-11 py-3 transition-all duration-200 focus:outline-none ${
                errors.password
                  ? "border-rose-500 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/10"
              }`}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <span className="text-xs text-rose-500 font-medium">{errors.password.message}</span>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 w-full bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white font-semibold py-3.5 rounded-xl shadow-md shadow-blue-500/20 transition-all duration-150 text-sm cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {/* Demo helper info */}
      <div className="mt-5 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 text-center">
        <span className="font-semibold text-slate-700 dark:text-slate-300">Quick Demo: </span>
        <code>sarah@example.com</code> | <code>password123</code>
      </div>

      {/* Footer link to Register */}
      <div className="mt-6 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-[#2563EB] hover:underline ml-1"
        >
          Register now
        </Link>
      </div>
    </div>
  );
}
