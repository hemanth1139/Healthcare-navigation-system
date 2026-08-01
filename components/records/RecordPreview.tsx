"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MedicalRecord } from "@/types/record";
import { PiiRedactionBadge } from "./PiiRedactionBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  FileText,
  Download,
  Trash2,
  ArrowLeft,
  Calendar,
  ShieldCheck,
  Database,
  HardDrive,
} from "lucide-react";

export interface RecordPreviewProps {
  record: MedicalRecord;
  onDeleteRecord: (recordId: string) => Promise<void>;
}

export const RecordPreview: React.FC<RecordPreviewProps> = ({
  record,
  onDeleteRecord,
}) => {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isImage = record.file_type.startsWith("image/");
  const formattedDate = new Date(record.upload_date).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "1.2 MB";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFhirPlainTranslation = (fhirType: string) => {
    switch (fhirType) {
      case "DiagnosticReport":
        return "Diagnostic & Radiology Laboratory Report";
      case "MedicationRequest":
        return "Prescription & Medication Order";
      case "Observation":
        return "Clinical Observation & Vital Measurement";
      default:
        return "HL7 FHIR Clinical Document Reference";
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleteRecord(record.record_id);
      router.push("/records?toast=deleted");
    } catch (err) {
      alert("Failed to delete record.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Header back navigation */}
      <div className="flex items-center justify-between border-b border-[#E6F4F3] pb-3">
        <Link
          href="/records"
          className="inline-flex items-center text-xs font-semibold text-[#0F6E7A] hover:underline focus-ring rounded p-1 -ml-1 gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Medical Records Gallery
        </Link>

        <div className="flex items-center gap-2">
          <a
            href={record.cloudinary_url}
            target="_blank"
            rel="noopener noreferrer"
            download={record.file_name}
          >
            <Button variant="primary" size="sm">
              <Download className="w-4 h-4 mr-1.5" />
              Download Original File
            </Button>
          </a>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-[#E5573F] hover:bg-[#FDF0EE]"
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Main Grid: Left Large Preview Viewport (8 cols), Right Metadata Sidebar (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Large Preview Viewport */}
        <Card className="lg:col-span-8 p-4 sm:p-6 border-2 border-[#E6F4F3] bg-white flex flex-col gap-4 shadow-clinical-lg min-h-[480px]">
          <div className="flex items-center justify-between border-b border-[#E6F4F3] pb-3">
            <h2 className="font-heading font-bold text-base text-[#1E2A2E] truncate">
              {record.file_name}
            </h2>
            <PiiRedactionBadge isRedacted={record.is_pii_redacted} />
          </div>

          <div className="flex-1 bg-[#F7FAFA] border border-[#E6F4F3] rounded-2xl flex items-center justify-center p-4 min-h-[380px] overflow-hidden relative">
            {isImage ? (
              <img
                src={record.cloudinary_url}
                alt={record.file_name}
                className="max-h-[500px] w-auto object-contain rounded-xl shadow-xs"
              />
            ) : (
              <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                <div className="w-16 h-16 rounded-2xl bg-[#E6F4F3] text-[#0F6E7A] flex items-center justify-center shadow-xs">
                  <FileText className="w-8 h-8" />
                </div>

                <div className="flex flex-col gap-1">
                  <h3 className="font-heading font-bold text-base text-[#1E2A2E]">
                    PDF Medical Document Preview
                  </h3>
                  <p className="text-xs text-[#5C6B6E]">
                    {record.file_name} ({formatFileSize(record.file_size_bytes)})
                  </p>
                </div>

                <a
                  href={record.cloudinary_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2"
                >
                  <Button variant="primary" size="md">
                    <FileText className="w-4 h-4 mr-2" />
                    Open PDF in Full Viewer
                  </Button>
                </a>
              </div>
            )}
          </div>
        </Card>

        {/* Right Metadata Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <Card className="p-5 border-2 border-[#E6F4F3] bg-white flex flex-col gap-4 shadow-xs">
            <h3 className="font-heading font-bold text-base text-[#1E2A2E] border-b border-[#E6F4F3] pb-2">
              Record Metadata & FHIR Profile
            </h3>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <span className="text-[#5C6B6E] font-medium">Category:</span>
                <span className="font-bold text-[#0F6E7A] bg-[#E6F4F3] px-2.5 py-0.5 rounded-full ml-2">
                  {record.category}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[#1E2A2E]">
                <Calendar className="w-4 h-4 text-[#0F6E7A]" />
                <span>Uploaded: <strong className="font-mono">{formattedDate}</strong></span>
              </div>

              <div className="flex items-center gap-1.5 text-[#1E2A2E]">
                <HardDrive className="w-4 h-4 text-[#0F6E7A]" />
                <span>File Size: <strong className="font-mono">{formatFileSize(record.file_size_bytes)}</strong></span>
              </div>

              <div className="pt-2 border-t border-[#E6F4F3] flex flex-col gap-1">
                <span className="text-[#5C6B6E] font-medium flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-[#0F6E7A]" /> HL7 FHIR Standard Profile:
                </span>
                <span className="font-mono font-bold text-xs text-[#0F6E7A] bg-[#F7FAFA] p-2 rounded-xl border border-[#E6F4F3]">
                  {record.fhir_resource_type}
                </span>
                <span className="text-[11px] text-[#5C6B6E] italic">
                  ({getFhirPlainTranslation(record.fhir_resource_type)})
                </span>
              </div>
            </div>

            {record.notes && (
              <div className="pt-3 border-t border-[#E6F4F3] flex flex-col gap-1">
                <span className="text-xs font-semibold text-[#1E2A2E]">Clinical Notes & Tags:</span>
                <p className="text-xs text-[#5C6B6E] leading-relaxed bg-[#F7FAFA] p-3 rounded-xl border border-[#E6F4F3]">
                  {record.notes}
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Medical Record?"
        message={`Are you sure you want to permanently delete "${record.file_name}"? This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        isDestructive
      />
    </div>
  );
};
