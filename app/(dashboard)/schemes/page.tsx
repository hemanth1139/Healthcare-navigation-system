"use client";

import React, { useState, useEffect } from "react";
import { GovernmentScheme, SchemeQuery } from "@/types/scheme";
import { schemeApi } from "@/lib/mockSchemeData";
import { SchemeQueryPanel } from "@/components/schemes/SchemeQueryPanel";
import { EligibilityResultCard } from "@/components/schemes/EligibilityResultCard";
import { SchemeFilterChips } from "@/components/schemes/SchemeFilterChips";
import { SchemeSearchBar } from "@/components/schemes/SchemeSearchBar";
import { SchemeList } from "@/components/schemes/SchemeList";
import { Spinner } from "@/components/ui/Spinner";

export default function SchemesLandingPage() {
  const [schemes, setSchemes] = useState<GovernmentScheme[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // RAG Query Result State
  const [queryResult, setQueryResult] = useState<SchemeQuery | null>(null);

  useEffect(() => {
    const fetchSchemes = async () => {
      setLoading(true);
      try {
        const data = await schemeApi.getSchemes(selectedCategory, searchQuery);
        setSchemes(data);
      } catch (err) {
        console.error("Failed to load schemes", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchemes();
  }, [selectedCategory, searchQuery]);

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto py-2">
      {/* Page Header */}
      <div className="border-b border-[#E6F4F3] pb-4">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#1E2A2E] tracking-tight">
          Government Healthcare Schemes & Subsidies
        </h1>
        <p className="text-xs sm:text-sm text-[#5C6B6E] mt-1">
          Find schemes you may be eligible for based on your health profile or ask a specific question to our AI RAG assistant
        </p>
      </div>

      {/* 1. Top Feature: SchemeQueryPanel (RAG Eligibility Query Box) */}
      <SchemeQueryPanel onQueryResult={(res) => setQueryResult(res)} />

      {/* Inline RAG Result View if query executed */}
      {queryResult && <EligibilityResultCard result={queryResult} />}

      {/* 2. Browse Directory Section */}
      <div className="flex flex-col gap-4 pt-4 border-t border-[#E6F4F3]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-heading font-bold text-lg text-[#1E2A2E]">
              Browse All Government Schemes
            </h2>
            <p className="text-xs text-[#5C6B6E]">
              Filter by department category or search by health benefits
            </p>
          </div>

          <div className="w-full sm:w-72">
            <SchemeSearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
        </div>

        {/* Filter Chips */}
        <SchemeFilterChips
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* Scheme List Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <Spinner size="lg" color="primary" />
            <span className="text-xs text-[#5C6B6E] mt-2">Loading scheme directory...</span>
          </div>
        ) : (
          <SchemeList
            schemes={schemes}
            onResetFilters={() => {
              setSelectedCategory("All");
              setSearchQuery("");
            }}
          />
        )}
      </div>
    </div>
  );
}
