"use client";

import React, { useState } from "react";
import { Allergy, AllergySeverity } from "@/types/profile";
import { AllergyFormModal } from "./AllergyFormModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AlertTriangle, Plus, Edit2, Trash2, ShieldCheck } from "lucide-react";
import { profileApi } from "@/lib/mockProfileData";

export const AllergyList: React.FC<{
  allergies: Allergy[];
  onRefresh: () => void;
}> = ({ allergies, onRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAllergy, setSelectedAllergy] = useState<Allergy | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Allergy | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenAdd = () => {
    setSelectedAllergy(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (allergy: Allergy) => {
    setSelectedAllergy(allergy);
    setIsModalOpen(true);
  };

  const handleSubmitModal = async (data: any) => {
    if (selectedAllergy) {
      await profileApi.updateAllergy({
        ...selectedAllergy,
        ...data,
      });
    } else {
      await profileApi.addAllergy(data);
    }
    onRefresh();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await profileApi.deleteAllergy(deleteTarget.allergy_id);
      setDeleteTarget(null);
      onRefresh();
    } finally {
      setIsDeleting(false);
    }
  };

  const getSeverityBadge = (severity: AllergySeverity) => {
    switch (severity) {
      case "Severe":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#EF4444] bg-[#FEF2F2] px-2.5 py-0.5 rounded-full border border-[#EF4444]/20">
            <AlertTriangle className="w-3 h-3" /> Severe
          </span>
        );
      case "Moderate":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#92400E] bg-[#FEF3C7] px-2.5 py-0.5 rounded-full border border-[#F59E0B]/20">
            Moderate
          </span>
        );
      case "Mild":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F172A] bg-[#F0FDFA] px-2.5 py-0.5 rounded-full">
            Mild
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading font-bold text-base text-[#0F172A]">
            Allergies & Sensitivities
          </h3>
          <p className="text-xs text-[#64748B]">
            Documented substance or medication allergies
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 mr-1" />
          Add Allergy
        </Button>
      </div>

      {/* List or Empty State */}
      {allergies.length === 0 ? (
        <Card className="p-8 text-center flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[#F0FDFA]">
          <div className="w-12 h-12 rounded-xl bg-[#F0FDFA] text-[#0D9488] flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h4 className="font-heading font-semibold text-base text-[#0F172A]">
            No Known Allergies Recorded
          </h4>
          <p className="text-xs text-[#64748B] max-w-sm">
            You currently have no documented allergies. Click below to add if needed.
          </p>
          <Button variant="secondary" size="sm" onClick={handleOpenAdd} className="mt-1">
            <Plus className="w-4 h-4 mr-1" />
            Add Allergy Record
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {allergies.map((item) => (
            <div
              key={item.allergy_id}
              className="bg-white p-4 rounded-xl border border-[#F0FDFA] hover:border-[#0D9488]/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2.5">
                  <h4 className="font-heading font-bold text-base text-[#0F172A]">
                    {item.allergy_name}
                  </h4>
                  {getSeverityBadge(item.severity)}
                </div>
                {item.notes && <p className="text-xs text-[#64748B]">{item.notes}</p>}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => handleOpenEdit(item)}
                  type="button"
                  aria-label={`Edit ${item.allergy_name}`}
                  className="p-1.5 rounded-lg text-[#0D9488] hover:bg-[#F0FDFA] transition-colors focus-ring"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setDeleteTarget(item)}
                  type="button"
                  aria-label={`Delete ${item.allergy_name}`}
                  className="p-1.5 rounded-lg text-[#EF4444] hover:bg-[#FEF2F2] transition-colors focus-ring"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <AllergyFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitModal}
        initialData={selectedAllergy}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Remove Allergy Record?"
        message={`Are you sure you want to delete "${deleteTarget?.allergy_name}" from your clinical record?`}
        confirmLabel="Remove Record"
        isLoading={isDeleting}
      />
    </div>
  );
};
