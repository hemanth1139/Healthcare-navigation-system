import React from "react";
import Link from "next/link";
import {
  Stethoscope,
  FileUp,
  Building2,
  ShieldAlert,
  User,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { QuickActionItem } from "@/lib/mockData";

const iconMap = {
  Stethoscope,
  FileUp,
  Building2,
  ShieldAlert,
  User,
  Sparkles,
};

export const QuickActionCard: React.FC<{ action: QuickActionItem }> = ({ action }) => {
  const IconComponent = iconMap[action.iconName] || Stethoscope;

  if (action.isPrimary) {
    return (
      <Link href={action.linkUrl} className="block group focus-ring rounded-2xl">
        <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-2 border-blue-600 hover:border-blue-700 transition-all duration-200 shadow-clinical-lg hover:shadow-2xl relative overflow-hidden h-full flex flex-col justify-between p-6">
          {/* Top accent badge */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-sm">
              <IconComponent className="w-6 h-6" />
            </div>

            {action.badgeText && (
              <span className="text-[11px] font-bold uppercase tracking-wider bg-white text-blue-600 px-2.5 py-1 rounded-full shadow-sm">
                {action.badgeText}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className="font-heading font-bold text-lg text-white group-hover:translate-x-0.5 transition-transform flex items-center justify-between">
              <span>{action.title}</span>
              <ArrowRight className="w-5 h-5 opacity-90 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-xs text-white/85 leading-relaxed">
              {action.description}
            </p>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={action.linkUrl} className="block group focus-ring rounded-2xl">
      <Card interactive className="h-full flex flex-col justify-between p-6">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <IconComponent className="w-6 h-6" />
          </div>

          {action.badgeText && (
            <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {action.badgeText}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="font-heading font-semibold text-base text-slate-900 group-hover:text-blue-600 transition-colors flex items-center justify-between">
            <span>{action.title}</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </h3>
          <p className="text-xs text-[#5C6B6E] leading-relaxed">
            {action.description}
          </p>
        </div>
      </Card>
    </Link>
  );
};
