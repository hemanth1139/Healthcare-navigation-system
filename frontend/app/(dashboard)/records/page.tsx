"use client";

import React, { useState, useEffect } from "react";
import { MedicalRecord, RecordCategory, UploadProgressState } from "@/types/record";
import { recordApi } from "@/lib/mockRecordData";
import { RecordFilterBar } from "@/components/records/RecordFilterBar";
import { RecordGrid } from "@/components/records/RecordGrid";
import { RecordUploadModal } from "@/components/records/RecordUploadModal";
import { UploadProgressToast } from "@/components/records/UploadProgressToast";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { CloudUpload } from "lucide-react";

export default function RecordsGalleryPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Modal & Toast states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressState | null>(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await recordApi.getRecords(selectedCategory, sortBy);
      setRecords(data);
    } catch (err) {
      console.error("Failed to load records", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [selectedCategory, sortBy]);

  const handleConfirmUpload = async (file: File, category: RecordCategory, notes?: string) => {
    // 1. Start Toast Progress Simulation
    setUploadProgress({
      file_name: file.name,
      progress_pct: 25,
      status: "uploading",
    });

    setTimeout(() => {
      setUploadProgress({
        file_name: file.name,
        progress_pct: 60,
        status: "redacting_pii",
      });
    }, 400);

    setTimeout(() => {
      setUploadProgress({
        file_name: file.name,
        progress_pct: 88,
        status: "fhir_indexing",
      });
    }, 700);

    // 2. Trigger API Upload
    const newRecord = await recordApi.uploadRecord(file, category, notes);

    setTimeout(() => {
      setUploadProgress({
        file_name: file.name,
        progress_pct: 100,
        status: "completed",
      });

      // Optimistic addition
      setRecords((prev) => [newRecord, ...prev]);

      setTimeout(() => {
        setUploadProgress(null);
      }, 2500);
    }, 1000);
  };

  const handleDeleteRecord = async (recordId: string) => {
    await recordApi.deleteRecord(recordId);
    setRecords((prev) => prev.filter((r) => r.record_id !== recordId));
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto py-2">
      {/* Header with Upload Record Button */}
      <div className="border-b border-[#E6F4F3] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#1E2A2E] tracking-tight">
            Medical Records Vault
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6B6E] mt-1">
            Store prescriptions, lab reports, and radiology scans with automated Presidio PII privacy protection
          </p>
        </div>

        <Button
          onClick={() => setIsUploadModalOpen(true)}
          variant="primary"
          size="lg"
          className="shrink-0"
        >
          <CloudUpload className="w-5 h-5 mr-2" />
          <span>Upload Record</span>
        </Button>
      </div>

      {/* Record Filter Bar */}
      <RecordFilterBar
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        sortBy={sortBy}
        onSortChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalCount={records.length}
      />

      {/* Record Grid / List View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 min-h-[300px]">
          <Spinner size="lg" color="primary" />
          <span className="text-xs text-[#5C6B6E] mt-2">Loading medical records gallery...</span>
        </div>
      ) : (
        <RecordGrid
          records={records}
          viewMode={viewMode}
          onDeleteRecord={handleDeleteRecord}
          onOpenUploadModal={() => setIsUploadModalOpen(true)}
          isFiltered={selectedCategory !== "All"}
        />
      )}

      {/* Record Upload Modal */}
      <RecordUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onConfirmUpload={handleConfirmUpload}
      />

      {/* Upload Progress Floating Toast */}
      <UploadProgressToast progress={uploadProgress} />
    </div>
  );
}
