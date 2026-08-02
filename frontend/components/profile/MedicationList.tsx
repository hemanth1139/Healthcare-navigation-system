"use client";

import React, { useState } from "react";
import { Medication } from "@/types/profile";
import { MedicationFormModal } from "./MedicationFormModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pill, Plus, Edit2, Trash2, Clock, UserCheck } from "lucide-react";
import { profileApi } from "@/lib/mockProfileData";

export const MedicationList: React.FC<{
  medications: Medication[];
  onRefresh: () => void;
}> = ({ medications, onRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Medication | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenAdd = () => {
    setSelectedMedication(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (medication: Medication) => {
    setSelectedMedication(medication);
    setIsModalOpen(true);
  };

  const handleSubmitModal = async (data: any) => {
    if (selectedMedication) {
      await profileApi.updateMedication({
        ...selectedMedication,
        ...data,
      });
    } else {
      await profileApi.addMedication(data);
    }
    onRefresh();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await profileApi.deleteMedication(deleteTarget.medication_id);
      setDeleteTarget(null);
      onRefresh();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading font-bold text-base text-[#1E2A2E]">
            Current Active Medications
          </h3>
          <p className="text-xs text-[#5C6B6E]">
            Active prescriptions, dosages, and schedules
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 mr-1" />
          Add Medication
        </Button>
      </div>

      {/* List or Empty State */}
      {medications.length === 0 ? (
        <Card className="p-8 text-center flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[#E6F4F3]">
          <div className="w-12 h-12 rounded-xl bg-[#E6F4F3] text-[#0F6E7A] flex items-center justify-center">
            <Pill className="w-6 h-6" />
          </div>
          <h4 className="font-heading font-semibold text-base text-[#1E2A2E]">
            No Current Medications Recorded
          </h4>
          <p className="text-xs text-[#5C6B6E] max-w-sm">
            You currently have no documented active prescriptions.
          </p>
          <Button variant="secondary" size="sm" onClick={handleOpenAdd} className="mt-1">
            <Plus className="w-4 h-4 mr-1" />
            Add Medication Record
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {medications.map((item) => (
            <div
              key={item.medication_id}
              className="bg-white p-4 rounded-xl border border-[#E6F4F3] hover:border-[#0F6E7A]/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2.5">
                  <h4 className="font-heading font-bold text-base text-[#1E2A2E]">
                    {item.medicine_name}
                  </h4>
                  <span className="text-xs font-mono font-bold text-[#0F6E7A] bg-[#E6F4F3] px-2.5 py-0.5 rounded-full">
                    {item.dosage}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#5C6B6E]">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-[#0F6E7A]" /> {item.frequency}
                  </span>
                  {item.prescribed_by && (
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-[#5C6B6E]" /> {item.prescribed_by}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => handleOpenEdit(item)}
                  type="button"
                  aria-label={`Edit ${item.medicine_name}`}
                  className="p-1.5 rounded-lg text-[#0F6E7A] hover:bg-[#E6F4F3] transition-colors focus-ring"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setDeleteTarget(item)}
                  type="button"
                  aria-label={`Delete ${item.medicine_name}`}
                  className="p-1.5 rounded-lg text-[#E5573F] hover:bg-[#FDF0EE] transition-colors focus-ring"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <MedicationFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitModal}
        initialData={selectedMedication}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Remove Medication Record?"
        message={`Are you sure you want to delete "${deleteTarget?.medicine_name}" from your prescription list?`}
        confirmLabel="Remove Medication"
        isLoading={isDeleting}
      />
    </div>
  );
};
