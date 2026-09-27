"use client";

import React, { useState, useRef } from "react";
import { SchemeDocument, DOCUMENT_CATEGORIES, DocumentCategory } from "@/types/document";
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

export type DocumentType = DocumentCategory;

export interface SchemeDocumentUploadProps {
  documents?: SchemeDocument[];
  onUpload?: (file: File, category: DocumentCategory) => void;
  onDelete?: (documentId: string) => void;
  onView?: (doc: SchemeDocument) => void;
  onDownload?: (doc: SchemeDocument) => void;
}

export const SchemeDocumentUpload: React.FC<SchemeDocumentUploadProps> = ({
  documents = [],
  onUpload,
  onDelete,
  onView,
  onDownload,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>("INCOME_CERTIFICATE");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (onUpload) {
      onUpload(file, selectedCategory);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Upload Zone */}
      <Card className="p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-[#0D9488] text-white flex items-center justify-center">
            <FolderUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-slate-100">
              Upload Eligibility Documents
            </h3>
            <p className="text-[11px] text-slate-500">
              Upload supporting documents required by government healthcare schemes
            </p>
          </div>
        </div>

        {/* Document Type Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            Document Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as DocumentCategory)}
            className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            {DOCUMENT_CATEGORIES.map((opt) => (
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
              ? "border-teal-500 bg-teal-50/40"
              : "border-slate-200 dark:border-slate-800 hover:border-teal-300 hover:bg-teal-50/20"
          }`}
        >
          <UploadCloud
            className={`w-10 h-10 ${isDragging ? "text-[#0D9488]" : "text-slate-300"}`}
          />
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Drop your file here, or{" "}
              <span className="text-[#0D9488] underline">browse</span>
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Supports PDF, JPG, PNG (max 10 MB)
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
        </div>
      </Card>

      {/* Uploaded Documents List */}
      {documents.length === 0 ? (
        <Card className="p-8 text-center flex flex-col items-center justify-center gap-2">
          <FileText className="w-8 h-8 text-slate-300" />
          <h4 className="font-heading font-semibold text-sm text-slate-700 dark:text-slate-300">No Documents Uploaded Yet</h4>
          <p className="text-xs text-slate-400 max-w-sm">
            Upload your income certificate, Aadhaar card, or eligibility card above to verify eligibility for government healthcare schemes.
          </p>
        </Card>
      ) : (
        <Card className="p-5 flex flex-col gap-3">
          <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-slate-100">
            Uploaded Documents ({documents.length})
          </h3>
          <div className="flex flex-col gap-2">
            {documents.map((doc) => (
              <div
                key={doc.document_id}
                className="flex items-center justify-between gap-3 border border-slate-100 dark:border-slate-800 rounded-xl p-3 bg-slate-50/60 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-850 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-[#0D9488]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {doc.file_name}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {doc.category.replace(/_/g, " ")} • {new Date(doc.upload_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                    <CheckCircle2 className="w-3 h-3" />
                    {doc.processing_status}
                  </span>

                  {onView && (
                    <button
                      title="View document"
                      onClick={() => onView(doc)}
                      className="p-1.5 rounded-lg hover:bg-teal-50 text-slate-400 hover:text-teal-600 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onDownload && (
                    <button
                      title="Download document"
                      onClick={() => onDownload(doc)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      title="Delete document"
                      onClick={() => onDelete(doc.document_id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
