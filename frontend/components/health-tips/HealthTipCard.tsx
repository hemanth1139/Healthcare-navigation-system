"use client";

import React, { useState } from "react";
import { HealthTip } from "@/types/healthTip";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Droplet, Apple, Sun, Activity, ShieldCheck, Heart, Clock, Sparkles } from "lucide-react";

export const HealthTipCard: React.FC<{ tip: HealthTip }> = ({ tip }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getIcon = () => {
    switch (tip.icon_type) {
      case "water":
        return <Droplet className="w-6 h-6 text-[#0F6E7A]" />;
      case "apple":
        return <Apple className="w-6 h-6 text-[#0F6E7A]" />;
      case "sun":
        return <Sun className="w-6 h-6 text-[#0F6E7A]" />;
      case "heart":
        return <Heart className="w-6 h-6 text-[#0F6E7A]" />;
      case "shield":
        return <ShieldCheck className="w-6 h-6 text-[#0F6E7A]" />;
      default:
        return <Activity className="w-6 h-6 text-[#0F6E7A]" />;
    }
  };

  return (
    <>
      <Card
        onClick={() => setIsOpen(true)}
        interactive
        className="p-5 border-2 border-[#E6F4F3] hover:border-[#0F6E7A] bg-white transition-all flex flex-col justify-between gap-4 h-full shadow-xs cursor-pointer"
      >
        <div className="flex flex-col gap-3">
          {/* Top Header: Icon & Category */}
          <div className="flex items-center justify-between gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#E6F4F3] flex items-center justify-center shrink-0">
              {getIcon()}
            </div>

            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F6E7A] bg-[#E6F4F3] px-2.5 py-0.5 rounded-full line-clamp-1">
              {tip.category}
            </span>
          </div>

          {/* Title in Sora font */}
          <h3 className="font-heading font-bold text-base text-[#1E2A2E] leading-snug line-clamp-2">
            {tip.title}
          </h3>

          {/* Target Condition Badge if any */}
          {tip.target_condition && (
            <span className="text-[11px] font-semibold text-[#0F6E7A] bg-[#E6F4F3]/70 px-2 py-0.5 rounded-md w-fit">
              Personalized for {tip.target_condition}
            </span>
          )}

          {/* 2-3 line Summary */}
          <p className="text-xs text-[#5C6B6E] leading-relaxed line-clamp-3">
            {tip.summary}
          </p>
        </div>

        {/* Card Footer: Read Time */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E6F4F3] text-xs text-[#5C6B6E]">
          <span className="font-mono flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#0F6E7A]" /> {tip.read_time}
          </span>
          <span className="font-semibold text-[#0F6E7A]">Read Tip →</span>
        </div>
      </Card>

      {/* Expanded Health Tip Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={tip.title}
        subtitle={`${tip.category} • ${tip.read_time}`}
      >
        <div className="flex flex-col gap-4 pt-1">
          <div className="bg-[#E6F4F3]/60 border border-[#0F6E7A]/20 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F6E7A] text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#0F6E7A] uppercase">
                Clinical Health Guidance
              </span>
              <p className="text-xs text-[#1E2A2E] font-medium mt-0.5">
                Evidence-based prevention advice tailored to your profile & region.
              </p>
            </div>
          </div>

          <div className="text-xs sm:text-sm text-[#1E2A2E] leading-relaxed font-body whitespace-pre-wrap p-2">
            {tip.full_content}
          </div>

          <div className="pt-3 border-t border-[#E6F4F3] flex justify-end">
            <Button variant="primary" size="md" onClick={() => setIsOpen(false)}>
              Close Tip
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
