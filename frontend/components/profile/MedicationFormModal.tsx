"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Medication } from "@/types/profile";

const medicationSchema = z.object({
  medicine_name: z.string().min(1, "Medicine name is required"),
  dosage: z.string().min(1, "Dosage is required (e.g., 500 mg, 10 ml)"),
  frequency: z.string().min(1, "Frequency is required (e.g., Twice daily)"),
  prescribed_by: z.string().optional(),
});

type MedicationFormData = z.infer<typeof medicationSchema>;

export interface MedicationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MedicationFormData) => Promise<void>;
  initialData?: Medication | null;
}

export const MedicationFormModal: React.FC<MedicationFormModalProps> = ({
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
  } = useForm<MedicationFormData>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      medicine_name: "",
      dosage: "",
      frequency: "",
      prescribed_by: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        medicine_name: initialData.medicine_name,
        dosage: initialData.dosage,
        frequency: initialData.frequency,
        prescribed_by: initialData.prescribed_by || "",
      });
    } else {
      reset({
        medicine_name: "",
        dosage: "",
        frequency: "",
        prescribed_by: "",
      });
    }
  }, [initialData, reset, isOpen]);

  const handleFormSubmit = async (data: MedicationFormData) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Medication Record" : "Add Active Medication"}
      subtitle="Document current prescriptions and dosage instructions"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} noValidate className="flex flex-col gap-4">
        <Input
          label="Medicine Name"
          type="text"
          placeholder="e.g. Metformin, Telmisartan, Amoxicillin"
          required
          error={errors.medicine_name?.message}
          {...register("medicine_name")}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Dosage Amount"
            type="text"
            placeholder="e.g. 500 mg, 10 ml"
            required
            error={errors.dosage?.message}
            {...register("dosage")}
          />

          <Input
            label="Frequency / Intake Time"
            type="text"
            placeholder="e.g. Twice daily after meals"
            required
            error={errors.frequency?.message}
            {...register("frequency")}
          />
        </div>

        <Input
          label="Prescribing Physician (Optional)"
          type="text"
          placeholder="e.g. Dr. Aris Thorne"
          error={errors.prescribed_by?.message}
          {...register("prescribed_by")}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6F4F3] mt-2">
          <Button variant="ghost" size="md" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
            {isEditing ? "Update Medication" : "Add Medication"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
