"use client";

import React, { useState } from "react";
import { RecordCategory } from "@/types/record";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { RecordUploadZone } from "./RecordUploadZone";
import { FileText, CheckCircle2, X } from "lucide-react";

export interface RecordUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmUpload: (file: File, category: RecordCategory, notes?: string) => Promise<void>;
}

export const RecordUploadModal: React.FC<RecordUploadModalProps> = ({
  isOpen,
  onClose,
  onConfirmUpload,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<RecordCategory>("Lab Report");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsSubmitting(true);
    try {
      await onConfirmUpload(selectedFile, category, notes);
      handleReset();
      onClose();
    } catch (err) {
      alert("Failed to upload record. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setCategory("Lab Report");
    setNotes("");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        handleReset();
        onClose();
      }}
      title="Upload Medical Record"
      subtitle="Prescriptions, Lab Reports, Radiology Scans & Discharge Summaries"
    >
      <div className="flex flex-col gap-4">
        {!selectedFile ? (
          <RecordUploadZone onFilesSelected={handleFilesSelected} />
        ) : (
          <div className="flex flex-col gap-4 bg-[#F7FAFA] border border-[#E6F4F3] rounded-2xl p-4 sm:p-5">
            {/* Selected File Header */}
            <div className="flex items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#E6F4F3]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#E6F4F3] text-[#0F6E7A] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-heading font-bold text-xs sm:text-sm text-[#1E2A2E] truncate">
                    {selectedFile.name}
                  </span>
                  <span className="font-mono text-[11px] text-[#5C6B6E]">
                    {formatFileSize(selectedFile.size)} • {selectedFile.type || "Document"}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedFile(null)}
                type="button"
                aria-label="Remove selected file"
                className="p-1 rounded-lg text-[#5C6B6E] hover:text-[#1E2A2E] focus-ring cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category Select (Required) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#1E2A2E]">
                Record Category <span className="text-[#E5573F]">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as RecordCategory)}
                className="w-full font-body text-xs sm:text-sm text-[#1E2A2E] bg-white border border-[#E6F4F3] rounded-xl px-3.5 py-2.5 focus-ring cursor-pointer"
              >
                <option value="Prescription">Prescription</option>
                <option value="Lab Report">Lab Report (Blood / Pathology)</option>
                <option value="Scan / Imaging">Scan / Imaging (X-Ray / MRI / Ultrasound)</option>
                <option value="Discharge Summary">Discharge Summary</option>
                <option value="Other">Other Clinical Document</option>
              </select>
            </div>

            {/* Optional Notes */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#1E2A2E]">
                Clinical Notes / Tags (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Annual lipid checkup prescribed by Dr. Roy."
                className="w-full font-body text-xs text-[#1E2A2E] bg-white border border-[#E6F4F3] rounded-xl p-3 focus-ring"
              />
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6F4F3] mt-2">
          <Button
            variant="ghost"
            size="md"
            onClick={() => {
              handleReset();
              onClose();
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isSubmitting}
            isLoading={isSubmitting}
            variant="primary"
            size="md"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Upload & Index Record
          </Button>
        </div>
      </div>
    </Modal>
  );
};
