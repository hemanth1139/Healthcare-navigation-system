"use client";

import React, { useState } from "react";
import { Modal } from "./Modal";
import { Input } from "./Input";
import { Button } from "./Button";
import { AlertTriangle } from "lucide-react";

export interface TypeToConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  expectedString?: string;
}

export const TypeToConfirmDialog: React.FC<TypeToConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  expectedString = "DELETE",
}) => {
  const [typedValue, setTypedValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMatch = typedValue.trim() === expectedString;

  const handleConfirm = async () => {
    if (!isMatch || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirm();
      setTypedValue("");
      onClose();
    } catch (err) {
      alert("Action failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setTypedValue("");
        onClose();
      }}
      title={title}
    >
      <div className="flex flex-col gap-4">
        <div className="bg-[#FEF2F2] dark:bg-[#450A0A] border border-[#EF4444]/30 rounded-xl p-3.5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
          <p className="text-xs text-[#0F172A] dark:text-[#F8FAFC] leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
            To confirm, type <strong className="font-mono text-[#EF4444]">&quot;{expectedString}&quot;</strong> in the box below:
          </label>

          <Input
            type="text"
            value={typedValue}
            onChange={(e) => setTypedValue(e.target.value)}
            placeholder={`Type ${expectedString} here`}
            autoFocus
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F0FDFA] dark:border-[#1E293B] mt-2">
          <Button
            variant="ghost"
            size="md"
            onClick={() => {
              setTypedValue("");
              onClose();
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            onClick={handleConfirm}
            disabled={!isMatch || isSubmitting}
            isLoading={isSubmitting}
            variant="urgent"
            size="md"
          >
            Permanently Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
};
