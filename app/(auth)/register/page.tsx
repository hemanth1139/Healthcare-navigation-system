"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, Mail, Phone, Lock, Eye, EyeOff, UserPlus, CheckCircle2 } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { FormError } from "@/components/ui/FormError";

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
        "Please enter a valid phone number (e.g., +1 (555) 000-0000)"
      ),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .regex(/.*[0-9].*/, "Password must contain at least 1 number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the Terms of Service & Privacy Policy to proceed",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

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
    formState: { errors, isSubmitting, isValid },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    defaultValues: {
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setGeneralError(null);
    try {
      await registerAuth(data);
      setSuccessNotice(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: any) {
      setGeneralError(err?.message || "Registration failed. Please check your information.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Heading */}
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-[#1E2A2E]">
          Create Your Account
        </h1>
        <p className="text-sm text-[#5C6B6E]">
          Join HealthCare Navigator to manage care plans & navigation
        </p>
      </div>

      {/* Success Banner */}
      {successNotice && (
        <Toast
          type="success"
          title="Account Created Successfully!"
          message="Welcome to HealthCare Navigator. Redirecting to your clinical dashboard..."
        />
      )}

      {/* General Error Banner */}
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
          placeholder="Dr. Sarah Jenkins"
          autoComplete="name"
          required
          leftIcon={<User className="w-4 h-4" />}
          error={errors.fullName?.message}
          {...register("fullName")}
        />

        {/* Email Address */}
        <Input
          label="Email Address"
          type="email"
          placeholder="sarah.jenkins@example.com"
          autoComplete="email"
          required
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register("email")}
        />

        {/* Phone Number */}
        <Input
          label="Phone Number"
          type="tel"
          placeholder="+1 (555) 234-5678"
          autoComplete="tel"
          required
          leftIcon={<Phone className="w-4 h-4" />}
          error={errors.phone?.message}
          {...register("phone")}
        />

        {/* Password */}
        <Input
          label="Password"
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
          error={errors.password?.message}
          {...register("password")}
        />

        {/* Confirm Password */}
        <Input
          label="Confirm Password"
          type={showConfirmPassword ? "text" : "password"}
          placeholder="Re-enter your password"
          autoComplete="new-password"
          required
          leftIcon={<Lock className="w-4 h-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-[#5C6B6E] hover:text-[#1E2A2E] p-1 rounded focus-ring"
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
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

        {/* Terms & Conditions Checkbox */}
        <div className="flex flex-col gap-1 mt-1">
          <label className="flex items-start gap-2.5 cursor-pointer text-sm text-[#1E2A2E]">
            <input
              type="checkbox"
              required
              className="mt-1 w-4 h-4 rounded border-[#E6F4F3] text-[#0F6E7A] focus:ring-[#0F6E7A] cursor-pointer"
              {...register("acceptTerms")}
            />
            <span className="text-xs text-[#5C6B6E] leading-relaxed">
              I agree to the{" "}
              <a href="#" className="font-semibold text-[#0F6E7A] hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="font-semibold text-[#0F6E7A] hover:underline">
                HIPAA Privacy Policy
              </a>
              .
            </span>
          </label>
          {errors.acceptTerms?.message && (
            <FormError message={errors.acceptTerms.message} />
          )}
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
          <UserPlus className="w-5 h-5 mr-2" />
          Create Account
        </Button>
      </form>

      {/* Footer link to Login */}
      <div className="pt-2 border-t border-[#E6F4F3] text-center text-sm text-[#5C6B6E]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-bold text-[#0F6E7A] hover:underline focus-ring rounded-sm px-1 py-0.5"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
