"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { MedicalRecord, RecordCategory, FhirResourceType } from "@/types/record";
import { api } from "@/lib/api";
import { RecordPreview } from "@/components/records/RecordPreview";
import { Spinner } from "@/components/ui/Spinner";

export default function RecordDetailPage({ params }: { params: Promise<{ recordId: string }> }) {
  const { recordId } = use(params);
  const router = useRouter();

  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecord = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/records/${recordId}`);
        const r = res.data;
        if (!r) {
          setError("Medical record not found.");
          return;
        }

        const fileName = r.recordName || r.record_name || r.file_name || "Diagnostic Record";
        const ext = fileName.split(".").pop()?.toLowerCase();
        let ftype: MedicalRecord["file_type"] = "pdf";
        if (ext === "png") ftype = "image/png";
        else if (ext === "jpg" || ext === "jpeg") ftype = "image/jpeg";
        else if (ext === "webp") ftype = "image/webp";

        const recObj: MedicalRecord = {
          record_id: r.recordId || r.record_id || recordId,
          profile_id: r.profileId || r.profile_id || "",
          file_name: fileName,
          cloudinary_url: r.originalFileUrl || r.cloudinary_url || "#",
          file_type: ftype,
          category: (r.recordType || r.category || "Lab Report") as RecordCategory,
          upload_date: r.createdAt || r.created_at || r.upload_date || new Date().toISOString(),
          is_pii_redacted: true,
          fhir_resource_type: "DiagnosticReport" as FhirResourceType,
          notes: r.anonymizedTextContent || r.fhir_resource,
        };

        setRecord(recObj);
      } catch (err: any) {
        console.error("Failed to load record details", err);
        setError("Unable to retrieve this medical record. It may have been removed or you do not have permission to access it.");
      } finally {
        setLoading(false);
      }
    };

    if (recordId) {
      fetchRecord();
    }
  }, [recordId]);

  const handleDelete = async (id: string) => {
    await api.delete(`/records/${id}`);
    router.push("/records");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[350px]">
        <Spinner size="lg" color="primary" />
        <span className="text-xs text-[#64748B] mt-2">Loading document preview & FHIR metadata...</span>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[350px] gap-4 text-center max-w-md mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
          <span className="text-xl font-bold">!</span>
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Unable to Load Record</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{error || "Record not found"}</p>
        </div>
        <button
          onClick={() => router.push("/records")}
          className="px-4 py-2 bg-[#0D9488] text-white text-xs font-semibold rounded-xl"
        >
          Return to Medical Records
        </button>
      </div>
    );
  }

  return (
    <div className="py-2">
      <RecordPreview
        record={record}
        onDeleteRecord={handleDelete}
      />
    </div>
  );
}
