"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PredictionsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/history");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px] text-slate-500 text-sm font-medium">
      Redirecting to Consultation History...
    </div>
  );
}
