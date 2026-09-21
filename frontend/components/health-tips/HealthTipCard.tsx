"use client";

import React, { useState } from "react";
import { HealthTip } from "@/types/healthTip";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Droplet, Apple, Sun, Activity, ShieldCheck, Heart, Clock, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export const HealthTipCard: React.FC<{ tip: HealthTip }> = ({ tip }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { language } = useLanguage();

  const getIcon = () => {
    switch (tip.icon_type) {
      case "water":
        return <Droplet className="w-6 h-6 text-[#0D9488]" />;
      case "apple":
        return <Apple className="w-6 h-6 text-[#0D9488]" />;
      case "sun":
        return <Sun className="w-6 h-6 text-[#0D9488]" />;
      case "heart":
        return <Heart className="w-6 h-6 text-[#0D9488]" />;
      case "shield":
        return <ShieldCheck className="w-6 h-6 text-[#0D9488]" />;
      default:
        return <Activity className="w-6 h-6 text-[#0D9488]" />;
    }
  };

  const getTranslatedCategory = (cat: string) => {
    if (language !== "ta") return cat;
    switch (cat.toLowerCase()) {
      case "seasonal": return "பருவகால ஆரோக்கியம்";
      case "chronic condition": return "நாள்பட்ட நோய் பராமரிப்பு";
      case "general wellness": return "பொது நல்வாழ்வு";
      default: return cat;
    }
  };

  return (
    <>
      <Card
        onClick={() => setIsOpen(true)}
        interactive
        className="p-5 border-2 border-[#F0FDFA] hover:border-[#0D9488] bg-white transition-all flex flex-col justify-between gap-4 h-full shadow-xs cursor-pointer"
      >
        <div className="flex flex-col gap-3">
          {/* Top Header: Icon & Category */}
          <div className="flex items-center justify-between gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#F0FDFA] flex items-center justify-center shrink-0">
              {getIcon()}
            </div>

            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0D9488] bg-[#F0FDFA] px-2.5 py-0.5 rounded-full line-clamp-1">
              {getTranslatedCategory(tip.category)}
            </span>
          </div>

          {/* Title in Sora font */}
          <h3 className="font-heading font-bold text-base text-[#0F172A] leading-snug line-clamp-2">
            {tip.title}
          </h3>

          {/* Target Condition Badge if any */}
          {tip.target_condition && (
            <span className="text-[11px] font-semibold text-[#0D9488] bg-[#F0FDFA]/70 px-2 py-0.5 rounded-md w-fit">
              {language === "ta" ? `${tip.target_condition} க்கான பிரத்யேக பரிந்துரை` : `Personalized for ${tip.target_condition}`}
            </span>
          )}

          {/* 2-3 line Summary */}
          <p className="text-xs text-[#64748B] leading-relaxed line-clamp-3">
            {tip.summary}
          </p>
        </div>

        {/* Card Footer: Read Time */}
        <div className="flex items-center justify-between pt-3 border-t border-[#F0FDFA] text-xs text-[#64748B]">
          <span className="font-mono flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#0D9488]" />{" "}
            {language === "ta" ? tip.read_time.replace("min read", "நிமிட வாசிப்பு") : tip.read_time}
          </span>
          <span className="font-semibold text-[#0D9488]">
            {language === "ta" ? "குறிப்பைப் படிக்க →" : "Read Tip →"}
          </span>
        </div>
      </Card>

      {/* Expanded Health Tip Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={tip.title}
        subtitle={`${getTranslatedCategory(tip.category)} • ${
          language === "ta" ? tip.read_time.replace("min read", "நிமிட வாசிப்பு") : tip.read_time
        }`}
      >
        <div className="flex flex-col gap-4 pt-1">
          <div className="bg-[#F0FDFA]/60 border border-[#0D9488]/20 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0D9488] text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#0D9488] uppercase">
                {language === "ta" ? "மருத்துவ சுகாதார வழிகாட்டுதல்" : "Clinical Health Guidance"}
              </span>
              <p className="text-xs text-[#0F172A] font-medium mt-0.5">
                {language === "ta"
                  ? "உங்கள் சுயவிவரம் மற்றும் பகுதிக்கு ஏற்ப ஆதாரப்பூர்வமான தடுப்பு ஆலோசனைகள்."
                  : "Evidence-based prevention advice tailored to your profile & region."}
              </p>
            </div>
          </div>

          <div className="text-xs sm:text-sm text-[#0F172A] leading-relaxed font-body whitespace-pre-wrap p-2">
            {tip.full_content}
          </div>

          <div className="pt-3 border-t border-[#F0FDFA] flex justify-end">
            <Button variant="primary" size="md" onClick={() => setIsOpen(false)}>
              {language === "ta" ? "மூடுக" : "Close Tip"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
