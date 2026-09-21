"use client";

import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { ShapExplanation } from "@/types/prediction";
import { Card } from "@/components/ui/Card";
import { ShapFeatureRow } from "./ShapFeatureRow";
import { BarChart2, Table as TableIcon, HelpCircle } from "lucide-react";

export interface ShapExplanationChartProps {
  explanations: ShapExplanation[];
}

export const ShapExplanationChart: React.FC<ShapExplanationChartProps> = ({
  explanations,
}) => {
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");

  // Transform data for Recharts
  const chartData = explanations.map((item) => ({
    name: item.plain_language_label,
    score: item.contribution_score,
    feature: item.feature_name,
  }));

  return (
    <Card className="p-5 sm:p-6 flex flex-col gap-4">
      {/* Header & Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0FDFA] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-bold text-base text-[#0F172A]">
              Key Contributing Clinical Factors
            </h2>
            <span className="text-[11px] font-semibold text-[#0D9488] bg-[#F0FDFA] px-2.5 py-0.5 rounded-full">
              SHAP Attribution
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            These factors most influenced this triage assessment
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-xl border border-[#F0FDFA] self-start sm:self-auto">
          <button
            onClick={() => setViewMode("chart")}
            type="button"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              viewMode === "chart"
                ? "bg-white text-[#0D9488] shadow-2xs"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Chart</span>
          </button>

          <button
            onClick={() => setViewMode("table")}
            type="button"
            aria-label="View feature contributions as accessible table"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              viewMode === "table"
                ? "bg-white text-[#0D9488] shadow-2xs"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Table</span>
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs font-medium text-[#64748B] bg-[#F8FAFC] p-2.5 rounded-xl border border-[#F0FDFA]">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[#0D9488]" />
          <span>Increases likelihood</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[#64748B]" />
          <span>Decreases likelihood</span>
        </div>
      </div>

      {/* View Content */}
      {viewMode === "chart" ? (
        <div className="w-full h-64 sm:h-72 my-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
            >
              <XAxis type="number" tick={{ fontSize: 11, fill: "#64748B" }} />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tick={{ fontSize: 11, fill: "#0F172A" }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-2.5 rounded-xl shadow-clinical-lg border border-[#F0FDFA] text-xs font-body">
                        <p className="font-bold text-[#0F172A]">{data.name}</p>
                        <p className="text-[#64748B] font-mono">
                          Contribution: {data.score > 0 ? `+${data.score}` : data.score}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine x={0} stroke="#F0FDFA" strokeWidth={2} />
              <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.score >= 0 ? "#0D9488" : "#64748B"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        /* Accessible Table View */
        <div className="flex flex-col gap-2 my-1">
          {explanations.map((item) => (
            <ShapFeatureRow key={item.shap_id} item={item} />
          ))}
        </div>
      )}
    </Card>
  );
};
