"use client";

import React, { useState } from "react";
import { ChronicCondition } from "@/types/profile";
import { ChronicConditionFormModal } from "./ChronicConditionFormModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Activity, Plus, Edit2, Trash2, Calendar } from "lucide-react";
import { profileApi } from "@/lib/mockProfileData";

export const ChronicConditionList: React.FC<{
  conditions: ChronicCondition[];
  onRefresh: () => void;
}> = ({ conditions, onRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState<ChronicCondition | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<ChronicCondition | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenAdd = () => {
    setSelectedCondition(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (condition: ChronicCondition) => {
    setSelectedCondition(condition);
    setIsModalOpen(true);
  };

  const handleSubmitModal = async (data: any) => {
    if (selectedCondition) {
      await profileApi.updateCondition({
        ...selectedCondition,
        ...data,
      });
    } else {
      await profileApi.addCondition(data);
    }
    onRefresh();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await profileApi.deleteCondition(deleteTarget.condition_id);
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
          <h3 className="font-heading font-bold text-base text-[#0F172A]">
            Chronic Medical Conditions
          </h3>
          <p className="text-xs text-[#64748B]">
            Diagnosed long-term health conditions and history
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 mr-1" />
          Add Condition
        </Button>
      </div>

      {/* List or Empty State */}
      {conditions.length === 0 ? (
        <Card className="p-8 text-center flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[#F0FDFA]">
          <div className="w-12 h-12 rounded-xl bg-[#F0FDFA] text-[#0D9488] flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <h4 className="font-heading font-semibold text-base text-[#0F172A]">
            No Chronic Conditions Recorded
          </h4>
          <p className="text-xs text-[#64748B] max-w-sm">
            You currently have no documented long-term medical conditions.
          </p>
          <Button variant="secondary" size="sm" onClick={handleOpenAdd} className="mt-1">
            <Plus className="w-4 h-4 mr-1" />
            Add Condition Record
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {conditions.map((item) => (
            <div
              key={item.condition_id}
              className="bg-white p-4 rounded-xl border border-[#F0FDFA] hover:border-[#0D9488]/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2.5">
                  <h4 className="font-heading font-bold text-base text-[#0F172A]">
                    {item.condition_name}
                  </h4>
                  {item.diagnosed_year && (
                    <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-[#0D9488] bg-[#F0FDFA] px-2.5 py-0.5 rounded-full">
                      <Calendar className="w-3 h-3" /> Since {item.diagnosed_year}
                    </span>
                  )}
                </div>
                {item.notes && <p className="text-xs text-[#64748B]">{item.notes}</p>}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => handleOpenEdit(item)}
                  type="button"
                  aria-label={`Edit ${item.condition_name}`}
                  className="p-1.5 rounded-lg text-[#0D9488] hover:bg-[#F0FDFA] transition-colors focus-ring"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setDeleteTarget(item)}
                  type="button"
                  aria-label={`Delete ${item.condition_name}`}
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
      <ChronicConditionFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitModal}
        initialData={selectedCondition}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Remove Condition Record?"
        message={`Are you sure you want to delete "${deleteTarget?.condition_name}" from your clinical record?`}
        confirmLabel="Remove Record"
        isLoading={isDeleting}
      />
    </div>
  );
};
