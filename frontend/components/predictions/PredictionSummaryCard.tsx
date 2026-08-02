import React from "react";
import Link from "next/link";
import { DiseasePrediction } from "@/types/prediction";
import { Calendar, Cpu, MessageSquare, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/Card";

export const PredictionSummaryCard: React.FC<{ prediction: DiseasePrediction }> = ({
  prediction,
}) => {
  const formattedDate = new Date(prediction.predicted_at).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <Card className="p-4 sm:p-5 border border-[#E6F4F3] bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#5C6B6E]">
        <div className="flex items-center gap-1.5 font-medium">
          <Calendar className="w-4 h-4 text-[#0F6E7A]" />
          <span>Assessed: {formattedDate}</span>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <Cpu className="w-4 h-4 text-[#0F6E7A]" />
          <span>Model: {prediction.prediction_model}</span>
        </div>
      </div>

      <Link
        href={`/chat/${prediction.conversation_id}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F6E7A] hover:underline focus-ring rounded p-1"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        <span>View Chat Transcript</span>
        <ArrowUpRight className="w-3.5 h-3.5" />
      </Link>
    </Card>
  );
};
