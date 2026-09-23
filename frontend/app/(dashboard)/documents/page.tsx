'use client';

import React, { useState } from 'react';
import { 
  Upload, 
  FileText, 
  FileCheck, 
  Trash2, 
  Eye, 
  Download, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  X,
  ShieldAlert,
  Search,
  Filter
} from 'lucide-react';

interface UserDoc {
  id: string;
  name: string;
  category: 'Income Certificate' | 'Eligibility Certificate' | 'Medical Report' | 'Aadhaar Card' | 'Other';
  uploadDate: string;
  size: string;
  status: 'Processed' | 'Processing' | 'Failed';
  format: 'PDF' | 'PNG' | 'JPG';
  url: string;
}

const INITIAL_DOCS: UserDoc[] = [];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<UserDoc[]>(INITIAL_DOCS);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<UserDoc['category']>('Medical Report');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<UserDoc | null>(null);

  // Delete Modal State
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      simulateUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      simulateUpload(e.target.files[0]);
    }
  };

  const simulateUpload = (file: File) => {
    setIsUploading(true);
    setUploadProgress(15);
    
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          
          const newDoc: UserDoc = {
            id: `doc-${Date.now()}`,
            name: file.name,
            category: uploadCategory,
            uploadDate: new Date().toISOString().split('T')[0],
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            status: 'Processing',
            format: file.name.endsWith('.pdf') ? 'PDF' : file.name.endsWith('.png') ? 'PNG' : 'JPG',
            url: '#'
          };

          setDocuments((prevDocs) => [newDoc, ...prevDocs]);
          
          // Simulate backend OCR finishing in 4s
          setTimeout(() => {
            setDocuments((prevDocs) =>
              prevDocs.map((d) => (d.id === newDoc.id ? { ...d, status: 'Processed' } : d))
            );
          }, 4000);

          return 0;
        }
        return prev + 25;
      });
    }, 300);
  };

  const handleDeleteConfirm = () => {
    if (deleteDocId) {
      setDocuments((prev) => prev.filter((doc) => doc.id !== deleteDocId));
      setDeleteDocId(null);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory;
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || doc.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Healthcare & Verification Documents
        </h1>
        <p className="mt-1 text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Upload medical reports, income certificates, and ID documents to automatically verify scheme eligibility and share with healthcare providers.
        </p>
      </div>

      {/* Upload Dropzone Box */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Upload New Document
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Supported formats: PDF, JPG, PNG (Max size: 15MB)</p>
          </div>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <label htmlFor="doc-category" className="text-xs font-medium text-slate-700 dark:text-slate-300">Category:</label>
            <select
              id="doc-category"
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value as UserDoc['category'])}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Income Certificate">Income Certificate</option>
              <option value="Eligibility Certificate">Eligibility Certificate</option>
              <option value="Medical Report">Medical Report</option>
              <option value="Aadhaar Card">Aadhaar Card</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all ${
            isDragging 
              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 scale-[1.01]' 
              : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500/70 bg-slate-50/50 dark:bg-slate-800/30'
          }`}
        >
          <input
            type="file"
            id="file-upload-input"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileSelect}
            className="hidden"
          />

          {isUploading ? (
            <div className="max-w-xs mx-auto space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Uploading & extracting metadata...</p>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{uploadProgress}% uploaded</p>
              </div>
            </div>
          ) : (
            <label htmlFor="file-upload-input" className="cursor-pointer space-y-3 block">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200/50 dark:border-emerald-800/50">
                <FileText className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Click to upload or drag & drop files here
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Documents are encrypted with AES-256 and used for automated scheme verification
                </p>
              </div>
              <button 
                type="button" 
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                Browse Local Files
              </button>
            </label>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
          {['All', 'Income Certificate', 'Eligibility Certificate', 'Medical Report', 'Aadhaar Card'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Document Grid */}
      {filteredDocs.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">No documents found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try changing your search term or upload a new file above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Format Icon & Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-xs uppercase border border-slate-200/60 dark:border-slate-700/60">
                      {doc.format}
                    </div>
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50">
                        {doc.category}
                      </span>
                    </div>
                  </div>

                  {/* Processing Status */}
                  {doc.status === 'Processed' ? (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  ) : doc.status === 'Processing' ? (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 animate-pulse">
                      <Clock className="w-3.5 h-3.5" />
                      OCR Scanning
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-rose-600 dark:text-rose-400">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Failed
                    </span>
                  )}
                </div>

                {/* File Title & Info */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" title={doc.name}>
                    {doc.name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span>Uploaded: {doc.uploadDate}</span>
                    <span>•</span>
                    <span>{doc.size}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 transition-colors"
                    title="Preview Document"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <a
                    href={doc.url}
                    download
                    className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 transition-colors"
                    title="Download File"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>

                <button
                  onClick={() => setDeleteDocId(doc.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Delete Document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{previewDoc.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{previewDoc.category} • {previewDoc.size}</p>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Preview Shell */}
            <div className="bg-slate-100 dark:bg-slate-950 rounded-xl p-8 min-h-[300px] flex flex-col items-center justify-center border border-slate-200 dark:border-slate-800 text-center">
              <FileText className="w-16 h-16 text-emerald-600 dark:text-emerald-400 mb-3" />
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Document Content Preview</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1">
                Extracted data verified: Name match (100%), Annual Income (₹ 1,20,000/yr), BPL Reference #884920.
              </p>
              <div className="mt-4 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-mono">
                Status: Ready for Government Scheme RAG Analysis
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteDocId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-sm w-full p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Delete Document?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Are you sure you want to delete this file? This action cannot be undone and may affect scheme eligibility verifications.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteDocId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
              >
                Delete File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
