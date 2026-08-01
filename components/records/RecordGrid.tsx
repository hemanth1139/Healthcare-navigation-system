"use client";

import React from "react";
import { MedicalRecord } from "@/types/record";
import { RecordCard } from "./RecordCard";
import { Button } from "@/components/ui/Button";
import { FolderOpen, CloudUpload, FilterX } from "lucide-react";

export interface RecordGridProps {
  records: MedicalRecord[];
  viewMode?: "grid" | "list";
  onDeleteRecord: (recordId: string) => Promise<void>;
  onOpenUploadModal: () => void;
  isFiltered?: boolean;
}

export const RecordGrid: React.FC<RecordGridProps> = ({
  records,
  viewMode = "grid",
  onDeleteRecord,
  onOpenUploadModal,
  isFiltered = false,
}) => {
  // Empty State: Filtered with no matches
  if (records.length === 0 && isFiltered) {
    return (
      <div className="bg-white border-2 border-dashed border-[#E6F4F3] rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3 my-4">
        <div className="w-12 h-12 rounded-2xl bg-[#E6F4F3] text-[#0F6E7A] flex items-center justify-center">
          <FilterX className="w-6 h-6" />
        </div>
        <h3 className="font-heading font-bold text-base text-[#1E2A2E]">
          No medical records in this category yet
        </h3>
        <p className="text-xs text-[#5C6B6E] max-w-sm">
          Try clearing the category filter or upload a new record to this category.
        </p>

        <Button onClick={onOpenUploadModal} variant="secondary" size="md" className="mt-1">
          <CloudUpload className="w-4 h-4 mr-1.5" />
          Upload New Record
        </Button>
      </div>
    );
  }

  // Empty State: Brand new user with 0 records
  if (records.length === 0) {
    return (
      <div className="bg-gradient-to-br from-[#E6F4F3]/60 via-[#F7FAFA] to-white border-2 border-[#0F6E7A]/20 rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-4 my-4 shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-[#0F6E7A] text-white flex items-center justify-center shadow-clinical">
          <FolderOpen className="w-8 h-8" />
        </div>

        <div className="flex flex-col gap-1 max-w-md">
          <h3 className="font-heading font-bold text-xl text-[#1E2A2E]">
            Keep your prescriptions and reports in one secure place
          </h3>
          <p className="text-xs sm:text-sm text-[#5C6B6E] leading-relaxed">
            Upload your medical documents for automated PII privacy protection, HL7 FHIR indexing, and instant sharing with health specialists.
          </p>
        </div>

        <Button onClick={onOpenUploadModal} variant="primary" size="lg" className="mt-2">
          <CloudUpload className="w-5 h-5 mr-2" />
          Upload Your First Record
        </Button>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="flex flex-col gap-3 my-2">
        {records.map((rec) => (
          <RecordCard
            key={rec.record_id}
            record={rec}
            viewMode="list"
            onDelete={onDeleteRecord}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 my-2">
      {records.map((rec) => (
        <RecordCard
          key={rec.record_id}
          record={rec}
          viewMode="grid"
          onDelete={onDeleteRecord}
        />
      ))}
    </div>
  );
};
