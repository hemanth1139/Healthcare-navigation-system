'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FileText,
  Trash2,
  Eye,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  ShieldCheck,
  Search,
  ExternalLink,
  FolderUp,
  FileCheck,
  FileSpreadsheet,
  Image as ImageIcon,
  Loader2,
  Plus,
  AlertTriangle,
  RefreshCw,
  Info,
} from 'lucide-react';
import { api } from '@/lib/api';
import { SchemeDocument, DOCUMENT_CATEGORIES, DocumentCategory } from '@/types/document';

export default function SchemeDocumentsPage() {
  const [documents, setDocuments] = useState<SchemeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('INCOME_CERTIFICATE');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<SchemeDocument | null>(null);

  // Delete Modal State
  const [deleteDoc, setDeleteDoc] = useState<SchemeDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch Documents
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/documents');
      setDocuments(res.data || []);
    } catch (err: any) {
      console.error('[SchemeDocuments] Failed to fetch documents:', err);
      showToast(err?.response?.data?.detail || 'Failed to load scheme documents.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Upload Handlers
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
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setUploadError(`Unsupported file format. Please upload PDF, PNG, JPG, or DOC files.`);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum limit is 10 MB.`);
      return;
    }
    setUploadError(null);
    setSelectedFile(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a document to upload.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(25);
    setUploadError(null);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => (prev < 85 ? prev + 15 : prev));
    }, 200);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('category', uploadCategory);

      const res = await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const newDoc: SchemeDocument = res.data;
      setDocuments((prev) => [newDoc, ...prev]);

      showToast(`"${newDoc.file_name}" uploaded and registered successfully.`, 'success');
      setTimeout(() => {
        setIsUploadModalOpen(false);
        setSelectedFile(null);
        setIsUploading(false);
        setUploadProgress(0);
      }, 400);
    } catch (err: any) {
      clearInterval(progressInterval);
      setIsUploading(false);
      setUploadProgress(0);
      const msg = err?.response?.data?.detail || err?.response?.data?.message || 'Document upload failed. Please try again.';
      setUploadError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  // Delete Handler
  const handleDeleteConfirm = async () => {
    if (!deleteDoc) return;
    setIsDeleting(true);
    try {
      await api.delete(`/documents/${deleteDoc.document_id}`);
      setDocuments((prev) => prev.filter((d) => d.document_id !== deleteDoc.document_id));
      showToast(`Document "${deleteDoc.file_name}" deleted permanently.`, 'success');
      setDeleteDoc(null);
    } catch (err: any) {
      console.error('[SchemeDocuments] Delete failed:', err);
      showToast(err?.response?.data?.detail || 'Failed to delete document. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Download Handler
  const handleDownload = async (doc: SchemeDocument) => {
    try {
      showToast(`Preparing download for "${doc.file_name}"...`, 'success');
      const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      const downloadUrl = `${baseURL}/documents/${doc.document_id}/download`;

      // Trigger download via anchor element
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', doc.file_name);
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('[SchemeDocuments] Download error:', err);
      // Fallback to direct url
      if (doc.cloudinary_url) {
        window.open(doc.cloudinary_url, '_blank');
      }
    }
  };

  // Helper formatting
  const getCategoryLabel = (catKey: string) => {
    const found = DOCUMENT_CATEGORIES.find((c) => c.value === catKey);
    return found ? found.label : catKey.replace(/_/g, ' ');
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getFileIcon = (fileType?: string | null, fileName: string = '') => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (fileType === 'pdf' || ext === 'pdf') {
      return <FileText className="w-6 h-6 text-rose-500" />;
    }
    if (fileType === 'image' || ['png', 'jpg', 'jpeg'].includes(ext || '')) {
      return <ImageIcon className="w-6 h-6 text-teal-600" />;
    }
    return <FileCheck className="w-6 h-6 text-indigo-500" />;
  };

  const getStatusBadge = (status: string) => {
    const s = (status || 'AVAILABLE').toUpperCase();
    if (s === 'AVAILABLE' || s === 'VERIFIED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" />
          Available
        </span>
      );
    }
    if (s === 'PROCESSING') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <RefreshCw className="w-3 h-3 animate-spin" />
          Processing
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
        <AlertCircle className="w-3 h-3" />
        Failed
      </span>
    );
  };

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchSearch =
      (doc.file_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      getCategoryLabel(doc.category).toLowerCase().includes(searchQuery.toLowerCase());

    const matchCategory =
      selectedCategoryFilter === 'ALL' || doc.category === selectedCategoryFilter;

    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto px-4 sm:px-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 ${
            toastMessage.type === 'success'
              ? 'bg-[#0D9488] text-white'
              : 'bg-rose-600 text-white'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <ShieldCheck className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 hover:opacity-75 transition-opacity"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-[#0D9488] flex items-center justify-center font-bold">
              <FolderUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Scheme Documents
              </h1>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Manage documents required to support your healthcare scheme eligibility.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setSelectedFile(null);
            setUploadError(null);
            setIsUploadModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0f766e] text-white text-xs sm:text-sm font-semibold shadow-md shadow-teal-500/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Upload Document</span>
        </button>
      </div>

      {/* SEARCH AND CATEGORY FILTERS */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by file name or document type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs sm:text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategoryFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategoryFilter === 'ALL'
                ? 'bg-[#0D9488] text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            All Documents ({documents.length})
          </button>
          {DOCUMENT_CATEGORIES.slice(0, 4).map((cat) => {
            const count = documents.filter((d) => d.category === cat.value).length;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategoryFilter(cat.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategoryFilter === cat.value
                    ? 'bg-[#0D9488] text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {cat.label} {count > 0 ? `(${count})` : ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* DOCUMENT LIST / GRID SECTION */}
      {loading ? (
        /* SKELETON LOADING STATE */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4 animate-pulse"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <div className="w-3/4 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="w-1/2 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div className="w-20 h-5 bg-slate-200 dark:bg-slate-800 rounded-full" />
                <div className="w-16 h-7 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredDocuments.length === 0 ? (
        /* EMPTY STATE */
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-teal-500/10 text-[#0D9488] flex items-center justify-center mx-auto shadow-inner">
            <FileText className="w-8 h-8 stroke-[1.75]" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              {searchQuery || selectedCategoryFilter !== 'ALL'
                ? 'No matching scheme documents found'
                : 'No scheme documents uploaded yet'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {searchQuery || selectedCategoryFilter !== 'ALL'
                ? 'Try adjusting your search query or category filter.'
                : 'Upload documents such as income or eligibility certificates when required for a government healthcare scheme.'}
            </p>
          </div>
          <div>
            <button
              onClick={() => {
                setSelectedFile(null);
                setUploadError(null);
                setIsUploadModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0f766e] text-white text-xs sm:text-sm font-semibold shadow-md shadow-teal-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
          </div>
        </div>
      ) : (
        /* DOCUMENT CARDS GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.document_id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md hover:border-teal-500/40 transition-all flex flex-col justify-between gap-4 group"
            >
              <div className="space-y-3">
                {/* Header: Icon & Title */}
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700/50">
                    {getFileIcon(doc.file_type, doc.file_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#0D9488] mb-0.5">
                      {getCategoryLabel(doc.category)}
                    </span>
                    <h3
                      className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate"
                      title={doc.file_name}
                    >
                      {doc.file_name}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      <span>Uploaded {formatDate(doc.upload_date)}</span>
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-400 font-medium">Status:</span>
                  {getStatusBadge(doc.processing_status)}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => handleDownload(doc)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-[#0D9488] dark:text-[#14B8A6] text-xs font-semibold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>

                <button
                  onClick={() => setDeleteDoc(doc)}
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

      {/* ========================================================================= */}
      {/* 1. UPLOAD DOCUMENT MODAL                                                  */}
      {/* ========================================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-[#0D9488] flex items-center justify-center font-bold">
                  <FolderUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Upload Scheme Document
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Provide verified supporting credentials for scheme eligibility
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isUploading && setIsUploadModalOpen(false)}
                disabled={isUploading}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Category Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Document Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
                  className="w-full text-xs sm:text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                >
                  {DOCUMENT_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  {DOCUMENT_CATEGORIES.find((c) => c.value === uploadCategory)?.description}
                </p>
              </div>

              {/* Drag and Drop Zone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Document File <span className="text-rose-500">*</span>
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-[#0D9488] bg-teal-50/50 dark:bg-teal-950/20 scale-[0.99]'
                      : 'border-slate-200 dark:border-slate-800 hover:border-[#0D9488]/60 bg-slate-50/50 dark:bg-slate-950/30'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    onChange={handleFileInputChange}
                    className="hidden"
                    disabled={isUploading}
                  />

                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-[#0D9488] flex items-center justify-center">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                          {selectedFile.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Click to change
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-[#0D9488] flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                          Click to browse or drag & drop document
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          PDF, PNG, JPG, JPEG, DOC (Max 10 MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {isUploading && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Uploading and verifying document...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-[#0D9488] transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error Message */}
              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  disabled={isUploading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0f766e] text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <span>Confirm & Upload</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PREVIEW DOCUMENT MODAL                                                 */}
      {/* ========================================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-[#0D9488] flex items-center justify-center font-bold">
                  {getFileIcon(previewDoc.file_type, previewDoc.file_name)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate max-w-sm sm:max-w-md">
                    {previewDoc.file_name}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {getCategoryLabel(previewDoc.category)} • Uploaded {formatDate(previewDoc.upload_date)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Viewer Content */}
            <div className="flex-1 overflow-y-auto space-y-4 min-h-[250px] flex flex-col justify-center">
              {previewDoc.file_type === 'image' ||
              ['png', 'jpg', 'jpeg'].includes(previewDoc.file_name.split('.').pop()?.toLowerCase() || '') ? (
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-2">
                  <img
                    src={previewDoc.cloudinary_url}
                    alt={previewDoc.file_name}
                    className="max-h-[360px] w-auto object-contain rounded-xl"
                  />
                </div>
              ) : previewDoc.file_type === 'pdf' ||
                previewDoc.file_name.toLowerCase().endsWith('.pdf') ? (
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 h-[360px] bg-slate-50 dark:bg-slate-950">
                  <iframe
                    src={previewDoc.cloudinary_url}
                    title={previewDoc.file_name}
                    className="w-full h-full border-0"
                  />
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                  <FileCheck className="w-12 h-12 text-[#0D9488] mx-auto" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {previewDoc.file_name}
                  </h4>
                  <p className="text-xs text-slate-500">
                    This file format is stored securely. You can view it by downloading or opening the original source.
                  </p>
                </div>
              )}

              {/* Metadata summary */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {getCategoryLabel(previewDoc.category)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {previewDoc.processing_status}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button
                onClick={() => handleDownload(previewDoc)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download File</span>
              </button>

              <div className="flex items-center gap-2">
                {previewDoc.cloudinary_url && (
                  <a
                    href={previewDoc.cloudinary_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0f766e] text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in New Tab</span>
                  </a>
                )}
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DELETE CONFIRMATION MODAL                                             */}
      {/* ========================================================================= */}
      {deleteDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-sm w-full p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Delete Scheme Document?
              </h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete <span className="font-semibold text-slate-700 dark:text-slate-300">&quot;{deleteDoc.file_name}&quot;</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteDoc(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Confirm Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
