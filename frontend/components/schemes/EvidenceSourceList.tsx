"use client";

import React, { useState } from "react";
import { RetrievedChunk } from "@/types/scheme";
import { ChevronDown, ExternalLink, FileText, BookOpen } from "lucide-react";

export interface EvidenceSourceListProps {
  chunks: RetrievedChunk[];
}

export const EvidenceSourceList: React.FC<EvidenceSourceListProps> = ({ chunks }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!chunks || chunks.length === 0) return null;

  return (
    <div className="border border-[#F0FDFA] rounded-xl overflow-hidden bg-[#F8FAFC] my-2">
      {/* Collapsible Header Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        aria-expanded={isOpen}
        aria-label="Toggle retrieved RAG evidence sources"
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-[#0D9488] hover:bg-[#F0FDFA]/50 transition-colors cursor-pointer focus-ring"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#0D9488]" />
          <span>Retrieved Evidence Sources ({chunks.length} Official Chunks)</span>
        </div>

        <ChevronDown className={`w-4 h-4 text-[#0D9488] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Expanded Chunks List */}
      {isOpen && (
        <div className="p-3.5 border-t border-[#F0FDFA] flex flex-col gap-3 bg-white animate-in slide-in-from-top-1 duration-150">
          {chunks.map((chk, idx) => (
            <div
              key={chk.chunk_id || idx}
              className="p-3 rounded-xl bg-[#F8FAFC] border border-[#F0FDFA] flex flex-col gap-1.5 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#0D9488]" />
                  {chk.scheme_name}
                </span>

                <a
                  href={chk.official_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Official source link for ${chk.scheme_name}`}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0D9488] hover:underline"
                >
                  <span>Official Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <p className="text-[#64748B] italic font-body leading-relaxed bg-white p-2 rounded-lg border border-[#F0FDFA]">
                &quot;{chk.excerpt}&quot;
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
