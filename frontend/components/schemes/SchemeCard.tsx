"use client";

import React from "react";
import Link from "next/link";
import { GovernmentScheme } from "@/types/scheme";
import { Card } from "@/components/ui/Card";
import { ShieldCheck, Calendar, ArrowRight, Users, ClipboardCheck } from "lucide-react";

export const SchemeCard: React.FC<{ scheme: GovernmentScheme }> = ({ scheme }) => {
  const criteria = scheme.eligibility_criteria;
  const eligibilityDetails = [
    criteria?.target_beneficiaries,
    criteria?.age_group ? `Age: ${criteria.age_group}` : undefined,
    criteria?.income_limit_per_annum_inr
      ? `Income limit: ${criteria.income_limit_per_annum_inr}`
      : undefined,
    criteria?.bpl_or_secc_required
      ? `BPL / SECC: ${criteria.bpl_or_secc_required}`
      : undefined,
  ].filter(Boolean);

  return (
    <Link href={`/schemes/${scheme.scheme_id}`} className="block group focus-ring rounded-2xl">
      <Card
        interactive
        className="p-5 border-2 border-[#F0FDFA] hover:border-[#0D9488] bg-white transition-all flex flex-col justify-between gap-4 h-full shadow-xs"
      >
        <div className="flex flex-col gap-2">
          {/* Eyebrow Department Tag */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0D9488] bg-[#F0FDFA] px-2.5 py-0.5 rounded-full line-clamp-1">
              {scheme.category || "Healthcare Scheme"}
            </span>

            <span className="text-[10px] font-mono text-[#64748B] flex items-center gap-1 shrink-0">
              <Calendar className="w-3 h-3 text-[#0D9488]" /> Updated {scheme.last_updated}
            </span>
          </div>

          {/* Scheme Title in Sora font */}
          <h3 className="font-heading font-bold text-base text-[#0F172A] group-hover:text-[#0D9488] transition-colors leading-snug line-clamp-2 mt-1">
            {scheme.scheme_name}
          </h3>

          {/* Department Subtitle */}
          <p className="text-xs text-[#64748B] line-clamp-1 font-medium">
            {scheme.department}
          </p>

          {/* Coverage Badge if present */}
          {scheme.coverage_amount && (
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#0D9488] bg-[#F0FDFA]/60 px-2.5 py-1 rounded-lg w-fit mt-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{scheme.coverage_amount}</span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-0.5">Benefits</p>
              <p className="text-xs text-[#64748B] line-clamp-3 leading-relaxed">
                {scheme.benefits || "See scheme details for available benefits."}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 flex items-center gap-1 mb-1">
                <Users className="w-3 h-3" /> Eligibility
              </p>
              {eligibilityDetails.length > 0 ? (
                <ul className="text-[11px] text-slate-600 space-y-0.5">
                  {eligibilityDetails.slice(0, 3).map((detail, index) => (
                    <li key={index} className="line-clamp-1">{detail}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-slate-600 line-clamp-2">
                  {scheme.eligibility || "See scheme details for eligibility criteria."}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="flex items-center justify-between pt-3 border-t border-[#F0FDFA] text-xs font-semibold text-[#0D9488]">
          <span className="flex items-center gap-1"><ClipboardCheck className="w-3.5 h-3.5" /> View Full Scheme Details</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </Card>
    </Link>
  );
};
