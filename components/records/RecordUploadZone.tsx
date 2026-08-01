"use client";

import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { CloudUpload, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface RecordUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export const RecordUploadZone: React.FC<RecordUploadZoneProps> = ({
  onFilesSelected,
  disabled = false,
}) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFilesSelected(acceptedFiles);
      }
    },
    [onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all duration-150 cursor-pointer flex flex-col items-center justify-center gap-3 ${
        isDragActive
          ? "border-[#0F6E7A] bg-[#E6F4F3] scale-101"
          : "border-[#0F6E7A]/40 hover:border-[#0F6E7A] bg-[#F7FAFA] hover:bg-[#E6F4F3]/30"
      }`}
    >
      <input {...getInputProps()} aria-label="Upload medical record file" />

      <div className="w-14 h-14 rounded-2xl bg-[#E6F4F3] text-[#0F6E7A] flex items-center justify-center shadow-xs">
        <CloudUpload className={`w-7 h-7 ${isDragActive ? "animate-bounce" : ""}`} />
      </div>

      <div className="flex flex-col gap-1 max-w-sm">
        <h3 className="font-heading font-bold text-sm sm:text-base text-[#1E2A2E]">
          {isDragActive
            ? "Drop your medical documents here..."
            : "Drag & drop your medical reports here"}
        </h3>
        <p className="text-xs text-[#5C6B6E]">
          Supports prescriptions, blood lab reports, radiology scans, and discharge summaries.
        </p>
      </div>

      <div className="flex items-center gap-2 my-1">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
            if (input) input.click();
          }}
        >
          Browse Files
        </Button>
      </div>

      <div className="flex items-center gap-3 text-[11px] font-mono text-[#5C6B6E] pt-2 border-t border-[#E6F4F3] w-full justify-center">
        <span className="flex items-center gap-1">
          <FileText className="w-3.5 h-3.5 text-[#0F6E7A]" /> PDF
        </span>
        <span className="flex items-center gap-1">
          <ImageIcon className="w-3.5 h-3.5 text-[#0F6E7A]" /> JPG / PNG
        </span>
        <span>(Max 20MB per file)</span>
      </div>
    </div>
  );
};
