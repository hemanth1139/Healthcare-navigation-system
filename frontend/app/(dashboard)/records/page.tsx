"use client";

import React, { useState } from "react";
import {
  Folder,
  Download,
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  Sparkles,
  ShieldCheck,
  Search,
} from "lucide-react";

export default function RecordsGalleryPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const records: any[] = [];

  const filteredRecords = records.filter((r) =>
    r.primarySymptom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.disease.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportPDF = (id: string) => {
    alert(`Exporting clinical PDF record summary for #${id}...`);
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Folder className="w-7 h-7 text-[#0D9488]" />
            <span>Structured Medical Records</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Persisted clinical symptom assessments with structured metadata and downloadable PDF reports.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search record by symptom or disease..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-[#0D9488]"
          />
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <Folder className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">No medical records stored</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Assessments performed during AI symptom consultations will automatically be saved here as structured records.
              </p>
            </div>
          </div>
        ) : (
          filteredRecords.map((rec) => (
            <div key={rec.id} className="card-clinical p-6 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-[#0D9488] dark:text-[#14B8A6] flex items-center justify-center font-bold text-xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-semibold">{rec.date} • ID #{rec.id}</span>
                    <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                      {rec.primarySymptom}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-teal-500/10 text-[#0D9488] dark:text-[#14B8A6] font-mono text-xs font-bold border border-teal-500/20">
                    {rec.confidence}% Confidence
                  </span>
                  <button
                    onClick={() => handleExportPDF(rec.id)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-[#0D9488]" />
                    <span>Export PDF</span>
                  </button>
                  <button
                    onClick={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {expandedId === rec.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Expandable Structured Metadata */}
              {expandedId === rec.id && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 animate-in fade-in">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Onset & Duration</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{rec.structuredData.duration}</span>
                    <span className="text-[11px] text-slate-500">{rec.structuredData.onset}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Associated Symptoms</span>
                    <div className="flex flex-wrap gap-1">
                      {rec.structuredData.associatedSymptoms.map((s: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-950 text-[10px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Risk Factors</span>
                    <div className="flex flex-wrap gap-1">
                      {rec.structuredData.riskFactors.map((r: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-950 text-[10px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Predicted Diagnosis</span>
                    <span className="text-xs font-bold text-[#0D9488] dark:text-[#14B8A6]">{rec.disease}</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
