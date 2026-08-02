"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { SpecialistRecommendation } from "@/types/specialist";
import { specialistApi } from "@/lib/mockSpecialistData";
import { SpecialistRecommendationCard } from "@/components/specialist/SpecialistRecommendationCard";
import { Spinner } from "@/components/ui/Spinner";
import { ArrowLeft } from "lucide-react";

export default function SpecialistRecommendationPage() {
  const params = useParams();
  const predictionId = (params?.predictionId as string) || "pred_101";

  const [recommendation, setRecommendation] = useState<SpecialistRecommendation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendation = async () => {
      try {
        const data = await specialistApi.getRecommendation(predictionId);
        setRecommendation(data);
      } catch (err) {
        console.error("Failed to load specialist recommendation", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendation();
  }, [predictionId]);

  if (loading || !recommendation) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[350px]">
        <Spinner size="lg" color="primary" />
        <span className="text-xs text-[#5C6B6E] mt-2">
          Mapping specialty clinical domain...
        </span>
      </div>
    );
  }

  const isEmergency = predictionId === "pred_emergency_102";

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto py-2">
      {/* Header back navigation */}
      <div className="flex items-center gap-2 border-b border-[#E6F4F3] pb-3">
        <Link
          href={`/predictions/${predictionId}`}
          className="inline-flex items-center text-xs font-semibold text-[#0F6E7A] hover:underline focus-ring rounded p-1 gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Prediction Results
        </Link>
      </div>

      {/* Specialist Recommendation Focused Card */}
      <SpecialistRecommendationCard
        recommendation={recommendation}
        isEmergency={isEmergency}
      />
    </div>
  );
}
