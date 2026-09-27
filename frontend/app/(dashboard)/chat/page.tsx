"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";

export default function ChatRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/symptom-chat");
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center p-12 min-h-[300px]">
      <Spinner size="lg" color="primary" />
      <span className="text-xs text-slate-500 mt-2">Connecting to Symptom Assessment Navigator...</span>
    </div>
  );
}
