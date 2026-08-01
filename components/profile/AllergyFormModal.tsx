"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Allergy, AllergySeverity } from "@/types/profile";

const allergySchema = z.object({
  allergy_name: z.string().min(1, "Allergy name is required"),
  severity: z.enum(["Mild", "Moderate", "Severe"] as const),
  notes: z.string().optional(),
});

type AllergyFormData = z.infer<typeof allergySchema>;

export interface AllergyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AllergyFormData) => Promise<void>;
  initialData?: Allergy | null;
}

export const AllergyFormModal: React.FC<AllergyFormModalProps> = ({
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
  } = useForm<AllergyFormData>({
    resolver: zodResolver(allergySchema),
    defaultValues: {
      allergy_name: "",
      severity: "Moderate",
      notes: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        allergy_name: initialData.allergy_name,
        severity: initialData.severity,
        notes: initialData.notes || "",
      });
    } else {
      reset({
        allergy_name: "",
        severity: "Moderate",
        notes: "",
      });
    }
  }, [initialData, reset, isOpen]);

  const handleFormSubmit = async (data: AllergyFormData) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Allergy Record" : "Add Allergy Record"}
      subtitle="Document known drug, food, or environmental allergies"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} noValidate className="flex flex-col gap-4">
        <Input
          label="Allergy / Allergen Name"
          type="text"
          placeholder="e.g. Penicillin, Peanuts, Latex"
          required
          error={errors.allergy_name?.message}
          {...register("allergy_name")}
        />

        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-sm font-medium text-[#1E2A2E]">
            Reaction Severity <span className="text-[#E5573F]">*</span>
          </label>
          <select
            className="w-full font-body text-sm text-[#1E2A2E] bg-white border border-[#E6F4F3] rounded-xl px-3.5 py-2.5 focus-ring"
            {...register("severity")}
          >
            <option value="Mild">Mild (slight rash, itchiness)</option>
            <option value="Moderate">Moderate (hives, mild swelling)</option>
            <option value="Severe">Severe (anaphylaxis, respiratory distress)</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-sm font-medium text-[#1E2A2E]">Clinical Notes / Guidance</label>
          <textarea
            rows={3}
            placeholder="e.g. Triggers severe reaction. Avoid Cephalosporins if possible."
            className="w-full font-body text-sm text-[#1E2A2E] bg-white border border-[#E6F4F3] rounded-xl p-3 focus-ring"
            {...register("notes")}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6F4F3] mt-2">
          <Button variant="ghost" size="md" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
            {isEditing ? "Update Allergy" : "Add Allergy"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
