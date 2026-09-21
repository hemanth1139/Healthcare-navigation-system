import React from "react";
import { ShapExplanation } from "@/types/prediction";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export const ShapFeatureRow: React.FC<{ item: ShapExplanation }> = ({ item }) => {
  const isPositive = item.contribution_score >= 0;

  return (
    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] border border-[#F0FDFA] text-xs">
      <div className="flex items-center gap-2">
        <div
          className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
            isPositive ? "bg-[#F0FDFA] text-[#0D9488]" : "bg-gray-100 text-[#64748B]"
          }`}
        >
          {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
        </div>

        <div className="flex flex-col">
          <span className="font-medium text-[#0F172A]">{item.plain_language_label}</span>
          <span className="text-[10px] font-mono text-[#64748B]">{item.feature_name}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 font-mono">
        <span
          className={`font-semibold px-2 py-0.5 rounded-md ${
            isPositive ? "bg-[#F0FDFA] text-[#0D9488]" : "bg-gray-100 text-[#64748B]"
          }`}
        >
          {isPositive ? `+${item.contribution_score.toFixed(2)}` : item.contribution_score.toFixed(2)}
        </span>
      </div>
    </div>
  );
};
