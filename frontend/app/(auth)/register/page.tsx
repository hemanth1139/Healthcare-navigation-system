"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User as UserIcon, Mail, Phone, Lock, Eye, EyeOff, UserPlus, ArrowRight } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";

const phoneRegex = /^(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;

const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(1, "Full name is required")
      .min(2, "Name must be at least 2 characters"),
    email: z
      .string()
      .min(1, "Email address is required")
      .email("Please enter a valid email address"),
    phone: z
      .string()
      .min(1, "Phone number is required")
      .refine(
        (val) => phoneRegex.test(val.replace(/\s+/g, "")),
        "Please enter a valid phone number (e.g., +91 98765 43210)"
      ),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .regex(/.*[0-9].*/, "Password must contain at least 1 number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the Terms of Service & Privacy Policy",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

// Password strength calculation helper
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

export default function RegisterPage() {
  const { register: registerAuth } = useAuth();
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      acceptTerms: false,
    },
  });

  const watchPassword = watch("password", "");
  const strength = getPasswordStrength(watchPassword);

  const onSubmit = async (data: RegisterFormData) => {
    setGeneralError(null);
    try {
      await registerAuth(data);
      setSuccessNotice(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: any) {
      setGeneralError(err?.message || "Registration failed. Please check your details.");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Heading */}
      <div>
        <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Create Account
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Join HealthNav AI for smart symptom triage and scheme verification.
        </p>
      </div>

      {/* Success Banner */}
      {successNotice && (
        <Toast
          type="success"
          title="Account Created!"
          message="Welcome to HealthNav AI. Redirecting to patient dashboard..."
        />
      )}

      {/* Error Banner */}
      {generalError && (
        <Toast
          type="error"
          title="Registration Failed"
          message={generalError}
          onClose={() => setGeneralError(null)}
        />
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        {/* Full Name */}
        <Input
          label="Full Name"
          type="text"
          placeholder="e.g. Rajesh Kumar"
          autoComplete="name"
          required
          leftIcon={<UserIcon className="w-4 h-4 text-slate-400" />}
          error={errors.fullName?.message}
          {...register("fullName")}
        />

        {/* Email Address */}
        <Input
          label="Email Address"
          type="email"
          placeholder="rajesh@example.com"
          autoComplete="email"
          required
          leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
          error={errors.email?.message}
          {...register("email")}
        />

        {/* Phone Number */}
        <Input
          label="Phone Number"
          type="tel"
          placeholder="+91 98765 43210"
          autoComplete="tel"
          required
          leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
          error={errors.phone?.message}
          {...register("phone")}
        />

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <Input
            label="Password"
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
            error={errors.password?.message}
            {...register("password")}
          />

          {/* Password Strength Indicator Bar */}
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

        {/* Confirm Password */}
        <Input
          label="Confirm Password"
          type={showConfirmPassword ? "text" : "password"}
          placeholder="Re-enter password"
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

        {/* Terms & Conditions Checkbox */}
        <div className="flex flex-col gap-1 mt-1">
          <label className="flex items-start gap-2.5 cursor-pointer text-sm text-slate-900 dark:text-slate-100">
            <input
              type="checkbox"
              required
              className="mt-1 w-4 h-4 rounded border-slate-300 text-[#0D9488] focus:ring-[#0D9488] cursor-pointer"
              {...register("acceptTerms")}
            />
            <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              I agree to the{" "}
              <Link href="/privacy" className="font-semibold text-[#0D9488] hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="font-semibold text-[#0D9488] hover:underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {errors.acceptTerms?.message && (
            <span className="text-xs text-rose-500 font-medium">{errors.acceptTerms.message}</span>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 w-full bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold py-3 rounded-xl shadow-md shadow-teal-500/25 transition-all text-sm cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <span>Creating account...</span>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Register Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Footer link */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-bold text-[#0D9488] dark:text-[#14B8A6] hover:underline ml-1"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}

