"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ChronicCondition } from "@/types/profile";

const currentYear = new Date().getFullYear();

const conditionSchema = z.object({
  condition_name: z.string().min(1, "Condition name is required"),
  diagnosed_year: z
    .number()
    .min(1900, "Year must be after 1900")
    .max(currentYear, `Year cannot exceed ${currentYear}`)
    .optional(),
  notes: z.string().optional(),
});

type ConditionFormData = z.infer<typeof conditionSchema>;

export interface ChronicConditionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ConditionFormData) => Promise<void>;
  initialData?: ChronicCondition | null;
}

export const ChronicConditionFormModal: React.FC<ChronicConditionFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ConditionFormData>({
    resolver: zodResolver(conditionSchema),
    defaultValues: {
      condition_name: "",
      diagnosed_year: undefined,
      notes: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        condition_name: initialData.condition_name,
        diagnosed_year: initialData.diagnosed_year || undefined,
        notes: initialData.notes || "",
      });
    } else {
      reset({
        condition_name: "",
        diagnosed_year: undefined,
        notes: "",
      });
    }
  }, [initialData, reset, isOpen]);

  const handleFormSubmit = async (data: ConditionFormData) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Chronic Condition" : "Add Chronic Condition"}
      subtitle="Document ongoing medical conditions or diagnoses"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} noValidate className="flex flex-col gap-4">
        <Input
          label="Condition Name"
          type="text"
          placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma"
          required
          error={errors.condition_name?.message}
          {...register("condition_name")}
        />

        <Input
          label="Diagnosed Year"
          type="number"
          placeholder={`e.g. ${currentYear - 3}`}
          error={errors.diagnosed_year?.message}
          {...register("diagnosed_year", { valueAsNumber: true })}
        />

        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-sm font-medium text-[#1E2A2E]">Treatment Notes & Guidance</label>
          <textarea
            rows={3}
            placeholder="e.g. Managed with diet and daily oral medication."
            className="w-full font-body text-sm text-[#1E2A2E] bg-white border border-[#E6F4F3] rounded-xl p-3 focus-ring"
            {...register("notes")}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6F4F3] mt-2">
          <Button variant="ghost" size="md" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
            {isEditing ? "Update Condition" : "Add Condition"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
