"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HealthTipsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/tips");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px] text-slate-500 text-sm font-medium">
      Redirecting to Health Tips...
    </div>
  );
}
