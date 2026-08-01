"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MedicalRecord } from "@/types/record";
import { PiiRedactionBadge } from "./PiiRedactionBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Card } from "@/components/ui/Card";
import {
  FileText,
  Eye,
  Download,
  Trash2,
  Calendar,
  MoreVertical,
  Image as ImageIcon,
} from "lucide-react";

export interface RecordCardProps {
  record: MedicalRecord;
  viewMode?: "grid" | "list";
  onDelete: (recordId: string) => Promise<void>;
}

export const RecordCard: React.FC<RecordCardProps> = ({
  record,
  viewMode = "grid",
  onDelete,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isImage = record.file_type.startsWith("image/");
  const formattedDate = new Date(record.upload_date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(record.record_id);
    } catch (err) {
      alert("Failed to delete record.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    window.open(record.cloudinary_url, "_blank");
  };

  if (viewMode === "list") {
    return (
      <>
        <Link href={`/records/${record.record_id}`} className="block group focus-ring rounded-2xl">
          <Card
            interactive
            className="p-4 border-2 border-[#E6F4F3] hover:border-[#0F6E7A] bg-white transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs"
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              {/* List Thumbnail */}
              <div className="w-12 h-12 rounded-xl bg-[#E6F4F3] flex items-center justify-center shrink-0 overflow-hidden border border-[#0F6E7A]/20">
                {isImage ? (
                  <img
                    src={record.cloudinary_url}
                    alt={record.file_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FileText className="w-6 h-6 text-[#0F6E7A]" />
                )}
              </div>

              <div className="flex flex-col min-w-0 gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F6E7A] bg-[#E6F4F3] px-2 py-0.5 rounded-full shrink-0">
                    {record.category}
                  </span>
                  <PiiRedactionBadge isRedacted={record.is_pii_redacted} />
                </div>

                <h3 className="font-heading font-bold text-sm text-[#1E2A2E] group-hover:text-[#0F6E7A] transition-colors truncate">
                  {record.file_name}
                </h3>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E6F4F3]">
              <span className="font-mono text-xs text-[#5C6B6E]">
                {formattedDate}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleDownload}
                  type="button"
                  aria-label={`Download ${record.file_name}`}
                  className="p-2 rounded-lg text-[#5C6B6E] hover:text-[#0F6E7A] hover:bg-[#E6F4F3] focus-ring transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowDeleteConfirm(true);
                  }}
                  type="button"
                  aria-label={`Delete ${record.file_name}`}
                  className="p-2 rounded-lg text-[#5C6B6E] hover:text-[#E5573F] hover:bg-[#FDF0EE] focus-ring transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        </Link>

        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
          title="Delete Medical Record?"
          message={`Are you sure you want to permanently delete "${record.file_name}"? This action cannot be undone.`}
          confirmLabel="Delete Permanently"
          isDestructive
        />
      </>
    );
  }

  // Grid View Card
  return (
    <>
      <Link href={`/records/${record.record_id}`} className="block group focus-ring rounded-2xl h-full">
        <Card
          interactive
          className="p-4 border-2 border-[#E6F4F3] hover:border-[#0F6E7A] bg-white transition-all flex flex-col justify-between gap-3.5 h-full shadow-xs"
        >
          {/* Thumbnail Box */}
          <div className="w-full h-36 rounded-xl bg-[#F7FAFA] border border-[#E6F4F3] flex items-center justify-center overflow-hidden relative group/thumb">
            {isImage ? (
              <img
                src={record.cloudinary_url}
                alt={`Medical record uploaded ${formattedDate}`}
                className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 p-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#E6F4F3] text-[#0F6E7A] flex items-center justify-center shadow-2xs">
                  <FileText className="w-7 h-7" />
                </div>
                <span className="font-mono text-[10px] font-bold text-[#0F6E7A] uppercase bg-white px-2.5 py-0.5 rounded-full border border-[#0F6E7A]/20">
                  PDF Document
                </span>
              </div>
            )}

            {/* Quick Action Overlay */}
            <div className="absolute inset-0 bg-[#0F6E7A]/20 backdrop-blur-2xs opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <span className="bg-white text-[#0F6E7A] text-xs font-bold px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> Preview
              </span>
            </div>
          </div>

          {/* Record Metadata */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F6E7A] bg-[#E6F4F3] px-2.5 py-0.5 rounded-full line-clamp-1">
                {record.category}
              </span>

              <PiiRedactionBadge isRedacted={record.is_pii_redacted} />
            </div>

            <h3
              className="font-heading font-bold text-sm text-[#1E2A2E] group-hover:text-[#0F6E7A] transition-colors leading-snug line-clamp-1"
              title={record.file_name}
            >
              {record.file_name}
            </h3>

            <div className="flex items-center justify-between text-xs text-[#5C6B6E] font-mono mt-1 pt-2 border-t border-[#E6F4F3]">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#0F6E7A]" />
                {formattedDate}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleDownload}
                  type="button"
                  aria-label={`Download ${record.file_name}`}
                  className="p-1.5 rounded-md text-[#5C6B6E] hover:text-[#0F6E7A] hover:bg-[#E6F4F3] focus-ring"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowDeleteConfirm(true);
                  }}
                  type="button"
                  aria-label={`Delete ${record.file_name}`}
                  className="p-1.5 rounded-md text-[#5C6B6E] hover:text-[#E5573F] hover:bg-[#FDF0EE] focus-ring"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </Card>
      </Link>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Medical Record?"
        message={`Are you sure you want to permanently delete "${record.file_name}"? This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        isDestructive
      />
    </>
  );
};
