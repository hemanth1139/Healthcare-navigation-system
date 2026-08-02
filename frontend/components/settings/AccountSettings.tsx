"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { User as UserIcon, Mail, Lock, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

export const AccountSettings: React.FC = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.fullName || "Patient User");
  const [email, setEmail] = useState(user?.email || "patient@healthcare-navigator.org");
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handlePasswordSubmit = async (data: PasswordFormData) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    alert("Password updated successfully!");
    reset();
    setIsPasswordModalOpen(false);
  };

  return (
    <form onSubmit={handleSaveAccount} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Full Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          leftIcon={<UserIcon className="w-4 h-4" />}
          required
        />

        <Input
          label="Account Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
          required
        />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setIsPasswordModalOpen(true)}
        >
          <Lock className="w-4 h-4 mr-1.5" />
          Change Password
        </Button>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="text-xs font-semibold text-[#0F6E7A] dark:text-[#25A0B0] bg-[#E6F4F3] dark:bg-[#0F6E7A]/20 px-3 py-1 rounded-lg">
              ✓ Account info saved
            </span>
          )}
          <Button type="submit" variant="primary" size="md">
            Save Account Settings
          </Button>
        </div>
      </div>

      {/* Password Change Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          reset();
          setIsPasswordModalOpen(false);
        }}
        title="Update Account Password"
        subtitle="Ensure your password is at least 8 characters long"
      >
        <form onSubmit={handleSubmit(handlePasswordSubmit)} noValidate className="flex flex-col gap-4">
          <Input
            label="Current Password"
            type="password"
            placeholder="••••••••"
            error={errors.currentPassword?.message}
            {...register("currentPassword")}
          />

          <Input
            label="New Password"
            type="password"
            placeholder="Minimum 8 characters"
            error={errors.newPassword?.message}
            {...register("newPassword")}
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Re-enter new password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6F4F3] dark:border-[#25363B] mt-2">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => {
                reset();
                setIsPasswordModalOpen(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
              Update Password
            </Button>
          </div>
        </form>
      </Modal>
    </form>
  );
};
