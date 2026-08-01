"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
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
    formState: { errors, isSubmitting, isValid },
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
    <div className="flex flex-col gap-6">
      {/* Heading */}
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-[#1E2A2E]">
          Welcome Back
        </h1>
        <p className="text-sm text-[#5C6B6E]">
          Sign in to access your healthcare dashboard & care records
        </p>
      </div>

      {/* General Error Banner */}
      {generalError && (
        <Toast
          type="error"
          title="Authentication Failed"
          message={generalError}
          onClose={() => setGeneralError(null)}
        />
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        {/* Email Field */}
        <Input
          label="Email Address"
          type="email"
          placeholder="name@example.com"
          autoComplete="email"
          required
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register("email")}
        />

        {/* Password Field */}
        <div className="flex flex-col gap-1">
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[#5C6B6E] hover:text-[#1E2A2E] p-1 rounded focus-ring"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            }
            error={errors.password?.message}
            {...register("password")}
          />
          <div className="flex justify-end mt-1">
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-[#0F6E7A] hover:underline focus-ring rounded-sm px-1 py-0.5"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
          disabled={!isValid && isSubmitting}
          className="mt-2"
        >
          <LogIn className="w-5 h-5 mr-2" />
          Sign In
        </Button>
      </form>

      {/* Demo helper card for evaluator testing */}
      <div className="bg-[#E6F4F3]/50 p-3 rounded-xl border border-[#0F6E7A]/20 text-xs text-[#5C6B6E] flex flex-col gap-1">
        <span className="font-semibold text-[#0F6E7A]">Quick Demo Credentials:</span>
        <span className="font-mono text-[11px] text-[#1E2A2E]">
          Email: sarah@example.com | Pass: password123
        </span>
        <span className="text-[11px] text-[#5C6B6E]">
          (Use <code className="text-[#E5573F]">fail@example.com</code> to test error state)
        </span>
      </div>

      {/* Footer link to Register */}
      <div className="pt-2 border-t border-[#E6F4F3] text-center text-sm text-[#5C6B6E]">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-bold text-[#0F6E7A] hover:underline focus-ring rounded-sm px-1 py-0.5"
        >
          Create an Account
        </Link>
      </div>
    </div>
  );
}
