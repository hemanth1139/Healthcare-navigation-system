"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { TypeToConfirmDialog } from "@/components/ui/TypeToConfirmDialog";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, Trash2 } from "lucide-react";

export const DangerZone: React.FC = () => {
  const { logout } = useAuth();
  const router = useRouter();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleDeleteAccount = async () => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    logout();
    router.push("/login?toast=account_deleted");
  };

  return (
    <div className="flex flex-col gap-3 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-heading font-bold text-sm text-[#0F172A] dark:text-[#F8FAFC]">
            Permanently Delete HealthCare Navigator Account
          </span>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
            Irreversibly delete your account, patient profile, symptom chat history, and uploaded medical documents.
          </p>
        </div>

        {/* Restrained Outlined Urgent Action Button */}
        <Button
          onClick={() => setIsConfirmOpen(true)}
          variant="ghost"
          size="md"
          className="text-[#EF4444] border border-[#EF4444]/40 hover:bg-[#FEF2F2] dark:hover:bg-[#450A0A] shrink-0"
        >
          <Trash2 className="w-4 h-4 mr-1.5" />
          Delete Account
        </Button>
      </div>

      {/* Friction-Gated Type-To-Confirm Modal */}
      <TypeToConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Delete HealthCare Navigator Account?"
        message="This action is permanent and cannot be undone. All clinical triage logs, diagnostic predictions, medical record files, and personal profile data will be permanently wiped."
        expectedString="DELETE"
      />
    </div>
  );
};
