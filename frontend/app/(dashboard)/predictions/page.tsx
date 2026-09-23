"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Activity, Bot } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

export default function PredictionsRedirectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasPredictions, setHasPredictions] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api
      .get("/history")
      .then(({ data }) => {
        if (!isMounted) return;
        if (Array.isArray(data) && data.length > 0) {
          const targetId = data[0].predictionId || data[0].conversationId;
          router.replace(`/predictions/${targetId}`);
        } else {
          setHasPredictions(false);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setHasPredictions(false);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
        <Spinner size="lg" color="primary" />
        <span className="text-xs text-slate-400">Loading diagnostic prediction records...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] max-w-md mx-auto text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-teal-500/10 text-[#0D9488] flex items-center justify-center mb-4">
        <Activity className="w-8 h-8" />
      </div>
      <h2 className="font-heading text-xl font-bold text-slate-900 dark:text-white">
        No Clinical Predictions Found
      </h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
        You haven&apos;t run any symptom triage consultations yet. Start an interactive session to generate rule-based differential diagnostic predictions.
      </p>
      <Link
        href="/symptom-chat"
        className="mt-6 px-5 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
      >
        <Bot className="w-4 h-4" />
        <span>Start Symptom Assessment</span>
      </Link>
    </div>
  );
}
