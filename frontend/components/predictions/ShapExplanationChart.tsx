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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E6F4F3] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-bold text-base text-[#1E2A2E]">
              Key Contributing Clinical Factors
            </h2>
            <span className="text-[11px] font-semibold text-[#0F6E7A] bg-[#E6F4F3] px-2.5 py-0.5 rounded-full">
              SHAP Attribution
            </span>
          </div>
          <p className="text-xs text-[#5C6B6E] mt-0.5">
            These factors most influenced this triage assessment
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-[#F7FAFA] p-1 rounded-xl border border-[#E6F4F3] self-start sm:self-auto">
          <button
            onClick={() => setViewMode("chart")}
            type="button"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              viewMode === "chart"
                ? "bg-white text-[#0F6E7A] shadow-2xs"
                : "text-[#5C6B6E] hover:text-[#1E2A2E]"
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
                ? "bg-white text-[#0F6E7A] shadow-2xs"
                : "text-[#5C6B6E] hover:text-[#1E2A2E]"
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Table</span>
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs font-medium text-[#5C6B6E] bg-[#F7FAFA] p-2.5 rounded-xl border border-[#E6F4F3]">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[#0F6E7A]" />
          <span>Increases likelihood</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[#5C6B6E]" />
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
              <XAxis type="number" tick={{ fontSize: 11, fill: "#5C6B6E" }} />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tick={{ fontSize: 11, fill: "#1E2A2E" }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-2.5 rounded-xl shadow-clinical-lg border border-[#E6F4F3] text-xs font-body">
                        <p className="font-bold text-[#1E2A2E]">{data.name}</p>
                        <p className="text-[#5C6B6E] font-mono">
                          Contribution: {data.score > 0 ? `+${data.score}` : data.score}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine x={0} stroke="#E6F4F3" strokeWidth={2} />
              <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.score >= 0 ? "#0F6E7A" : "#5C6B6E"}
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
