"use client";

import React from "react";
import Link from "next/link";
import { GovernmentScheme } from "@/types/scheme";
import { Card } from "@/components/ui/Card";
import { ShieldCheck, Calendar, ArrowRight } from "lucide-react";

export const SchemeCard: React.FC<{ scheme: GovernmentScheme }> = ({ scheme }) => {
  return (
    <Link href={`/schemes/${scheme.scheme_id}`} className="block group focus-ring rounded-2xl">
      <Card
        interactive
        className="p-5 border-2 border-[#E6F4F3] hover:border-[#0F6E7A] bg-white transition-all flex flex-col justify-between gap-4 h-full shadow-xs"
      >
        <div className="flex flex-col gap-2">
          {/* Eyebrow Department Tag */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F6E7A] bg-[#E6F4F3] px-2.5 py-0.5 rounded-full line-clamp-1">
              {scheme.category || "Healthcare Scheme"}
            </span>

            <span className="text-[10px] font-mono text-[#5C6B6E] flex items-center gap-1 shrink-0">
              <Calendar className="w-3 h-3 text-[#0F6E7A]" /> Updated {scheme.last_updated}
            </span>
          </div>

          {/* Scheme Title in Sora font */}
          <h3 className="font-heading font-bold text-base text-[#1E2A2E] group-hover:text-[#0F6E7A] transition-colors leading-snug line-clamp-2 mt-1">
            {scheme.scheme_name}
          </h3>

          {/* Department Subtitle */}
          <p className="text-xs text-[#5C6B6E] line-clamp-1 font-medium">
            {scheme.department}
          </p>

          {/* Coverage Badge if present */}
          {scheme.coverage_amount && (
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#0F6E7A] bg-[#E6F4F3]/60 px-2.5 py-1 rounded-lg w-fit mt-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{scheme.coverage_amount}</span>
            </div>
          )}

          {/* Truncated Benefits Summary */}
          <p className="text-xs text-[#5C6B6E] line-clamp-2 leading-relaxed mt-1">
            {scheme.benefits}
          </p>
        </div>

        {/* Footer Action */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E6F4F3] text-xs font-semibold text-[#0F6E7A]">
          <span>View Eligibility & Benefits</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </Card>
    </Link>
  );
};
