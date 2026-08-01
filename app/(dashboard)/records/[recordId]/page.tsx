"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { MedicalRecord } from "@/types/record";
import { recordApi } from "@/lib/mockRecordData";
import { RecordPreview } from "@/components/records/RecordPreview";
import { Spinner } from "@/components/ui/Spinner";

export default function RecordDetailPage() {
  const params = useParams();
  const recordId = params?.recordId as string;

  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecord = async () => {
      setLoading(true);
      try {
        const data = await recordApi.getRecordById(recordId);
        setRecord(data);
      } catch (err) {
        console.error("Failed to load record details", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [recordId]);

  if (loading || !record) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[350px]">
        <Spinner size="lg" color="primary" />
        <span className="text-xs text-[#5C6B6E] mt-2">Loading document preview & FHIR metadata...</span>
      </div>
    );
  }

  return (
    <div className="py-2">
      <RecordPreview
        record={record}
        onDeleteRecord={(id) => recordApi.deleteRecord(id)}
      />
    </div>
  );
}
