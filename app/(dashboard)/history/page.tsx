"use client";

import React, { useState, useEffect } from "react";
import { HistoryItem, HistoryTypeFilter, HistoryDateRange } from "@/types/history";
import { historyApi } from "@/lib/mockHistoryData";
import { HistoryFilterBar } from "@/components/history/HistoryFilterBar";
import { HistoryTimeline } from "@/components/history/HistoryTimeline";
import { HistoryDetailDrawer } from "@/components/history/HistoryDetailDrawer";
import { Spinner } from "@/components/ui/Spinner";

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedType, setSelectedType] = useState<HistoryTypeFilter>("All");
  const [dateRange, setDateRange] = useState<HistoryDateRange>("all");

  // Drawer State
  const [selectedDrawerItem, setSelectedDrawerItem] = useState<HistoryItem | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const data = await historyApi.getHistory(selectedType, dateRange);
        setItems(data);
      } catch (err) {
        console.error("Failed to load history items", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [selectedType, dateRange]);

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto py-2">
      {/* Page Header */}
      <div className="border-b border-[#E6F4F3] pb-4">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#1E2A2E] tracking-tight">
          Your Health Activity Timeline
        </h1>
        <p className="text-xs sm:text-sm text-[#5C6B6E] mt-1">
          Unified history of past symptom checks, AI triage predictions, medical record uploads, and government scheme queries
        </p>
      </div>

      {/* Filter Bar */}
      <HistoryFilterBar
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      {/* Grouped Vertical Timeline */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 min-h-[300px]">
          <Spinner size="lg" color="primary" />
          <span className="text-xs text-[#5C6B6E] mt-2">Loading health activity timeline...</span>
        </div>
      ) : (
        <HistoryTimeline
          items={items}
          onOpenDrawer={(item) => setSelectedDrawerItem(item)}
        />
      )}

      {/* Slide-over Detail Drawer / Mobile Sheet */}
      <HistoryDetailDrawer
        isOpen={!!selectedDrawerItem}
        onClose={() => setSelectedDrawerItem(null)}
        item={selectedDrawerItem}
      />
    </div>
  );
}
