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
      {/* Heading & Subtitle */}
      <div className="mb-8">
        <h1 className="font-heading font-bold text-3xl text-slate-900 dark:text-white tracking-tight">
          Welcome back
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Sign in to continue to your MediNav dashboard.
        </p>
      </div>

      {/* General Error Banner */}
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

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        {/* Username / Email Field */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="email"
            className="text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            className={`w-full text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-[#0F172A] placeholder:text-slate-400 border-0 border-b-2 px-1 py-2.5 transition-colors duration-150 focus:outline-none ${
              errors.email
                ? "border-b-rose-500"
                : "border-b-slate-200 dark:border-b-slate-700 focus:border-b-[#0D9488]"
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
              className="text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-[#0D9488] hover:underline"
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
              className={`w-full text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-[#0F172A] placeholder:text-slate-400 border-0 border-b-2 pl-1 pr-9 py-2.5 transition-colors duration-150 focus:outline-none ${
                errors.password
                  ? "border-b-rose-500"
                  : "border-b-slate-200 dark:border-b-slate-700 focus:border-b-[#0D9488]"
              }`}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
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
          className="mt-3 w-full bg-[#0D9488] hover:bg-[#0F766E] active:bg-[#115E59] text-white font-semibold py-3 rounded-full shadow-lg shadow-teal-500/20 transition-all duration-150 text-sm cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {/* Demo helper info */}
      <div className="mt-6 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 justify-center">
        <span className="font-semibold text-slate-700 dark:text-slate-300">Demo access:</span>
        <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">sarah@example.com</code>
        <span>/</span>
        <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">password123</code>
      </div>

      {/* Footer link to Register */}
      <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-[#0D9488] hover:underline ml-1"
        >
          Create one
        </Link>
      </div>
    </div>
  );
}
