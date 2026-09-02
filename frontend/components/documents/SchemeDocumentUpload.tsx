"use client";

import React, { useState, useRef } from "react";
import { SchemeDocument, DocumentType, DocumentProcessingStatus } from "@/types/document";
import { Card } from "@/components/ui/Card";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Trash2,
  Eye,
  Download,
  FolderUp,
} from "lucide-react";

// Mock document list (in real app, fetched from backend)
const MOCK_DOCUMENTS: SchemeDocument[] = [
  {
    document_id: "doc_001",
    profile_id: "user_001",
    scheme_id: "sch_03",
    document_type: "income_certificate",
    document_type_label: "Income Certificate",
    file_name: "income_certificate_2026.pdf",
    file_size_bytes: 245000,
    mime_type: "application/pdf",
    processing_status: "verified",
    uploaded_at: "2026-07-28T14:00:00Z",
    verified_at: "2026-07-29T10:00:00Z",
  },
  {
    document_id: "doc_002",
    profile_id: "user_001",
    scheme_id: "sch_03",
    document_type: "aadhaar_card",
    document_type_label: "Aadhaar Card",
    file_name: "aadhaar_card_scan.jpg",
    file_size_bytes: 980000,
    mime_type: "image/jpeg",
    processing_status: "processing",
    uploaded_at: "2026-07-15T10:00:00Z",
  },
];

const DOCUMENT_TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: "income_certificate", label: "Income Certificate" },
  { value: "caste_certificate", label: "Caste/Category Certificate" },
  { value: "aadhaar_card", label: "Aadhaar Card" },
  { value: "ration_card", label: "Ration Card" },
  { value: "disability_certificate", label: "Disability Certificate" },
  { value: "birth_certificate", label: "Birth Certificate" },
  { value: "other", label: "Other Document" },
];

const STATUS_CONFIG: Record<
  DocumentProcessingStatus,
  { icon: React.ReactNode; label: string; color: string; bg: string }
> = {
  pending: {
    icon: <Clock className="w-3.5 h-3.5" />,
    label: "Pending",
    color: "text-slate-600",
    bg: "bg-slate-100",
  },
  processing: {
    icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" />,
    label: "Processing",
    color: "text-blue-700",
    bg: "bg-blue-50",
  },
  verified: {
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    label: "Verified",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
  },
  rejected: {
    icon: <XCircle className="w-3.5 h-3.5" />,
    label: "Rejected",
    color: "text-red-700",
    bg: "bg-red-50",
  },
  requires_reupload: {
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    label: "Re-upload Required",
    color: "text-amber-700",
    bg: "bg-amber-50",
  },
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export const SchemeDocumentUpload: React.FC = () => {
  const [documents, setDocuments] = useState<SchemeDocument[]>(MOCK_DOCUMENTS);
  const [selectedType, setSelectedType] = useState<DocumentType>("income_certificate");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    // Simulate upload progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null || prev >= 100) {
          clearInterval(interval);
          // Add to documents list
          const typeLabel =
            DOCUMENT_TYPE_OPTIONS.find((t) => t.value === selectedType)?.label || "Document";
          const newDoc: SchemeDocument = {
            document_id: `doc_${Date.now()}`,
            profile_id: "user_001",
            document_type: selectedType,
            document_type_label: typeLabel,
            file_name: file.name,
            file_size_bytes: file.size,
            mime_type: file.type,
            processing_status: "pending",
            uploaded_at: new Date().toISOString(),
          };
          setDocuments((prev) => [newDoc, ...prev]);
          setUploadProgress(null);
          return null;
        }
        return prev + 20;
      });
    }, 200);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDelete = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.document_id !== id));
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Upload Zone */}
      <Card className="p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <FolderUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-slate-900">
              Upload Eligibility Documents
            </h3>
            <p className="text-[11px] text-slate-500">
              Upload supporting documents required by government healthcare schemes
            </p>
          </div>
        </div>

        {/* Document Type Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Document Type
          </label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as DocumentType)}
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {DOCUMENT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/30"
          }`}
        >
          <UploadCloud
            className={`w-10 h-10 ${isDragging ? "text-blue-600" : "text-slate-300"}`}
          />
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">
              Drop your file here, or{" "}
              <span className="text-blue-600 underline">browse</span>
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Supports PDF, JPG, PNG (max 10 MB)
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
        </div>

        {/* Upload Progress */}
        {uploadProgress !== null && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Uploaded Documents List */}
      {documents.length > 0 && (
        <Card className="p-5 flex flex-col gap-3">
          <h3 className="font-heading font-bold text-sm text-slate-900">
            Uploaded Documents ({documents.length})
          </h3>
          <div className="flex flex-col gap-2">
            {documents.map((doc) => {
              const statusCfg = STATUS_CONFIG[doc.processing_status];
              return (
                <div
                  key={doc.document_id}
                  className="flex items-center justify-between gap-3 border border-slate-100 rounded-xl p-3 bg-slate-50/60 hover:bg-white transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {doc.file_name}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {doc.document_type_label} • {formatFileSize(doc.file_size_bytes)} •{" "}
                        {formatDate(doc.uploaded_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.color}`}
                    >
                      {statusCfg.icon}
                      {statusCfg.label}
                    </span>

                    {/* Actions */}
                    <button
                      title="View document"
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      title="Download document"
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      title="Delete document"
                      onClick={() => handleDelete(doc.document_id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};
