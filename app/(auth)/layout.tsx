import React from "react";
import Link from "next/link";
import { Activity } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F4F7FB] dark:bg-[#0B0F17] p-4 sm:p-6 md:p-8">
      {/* Centered Minimalist White Card Container */}
      <main className="w-full max-w-[420px]">
        <div className="bg-white dark:bg-[#151D2A] border border-slate-100 dark:border-slate-800 rounded-[28px] p-8 sm:p-10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] flex flex-col">
          {/* Centered App Icon Badge */}
          <div className="flex justify-center mb-5">
            <Link
              href="/login"
              className="w-14 h-14 rounded-2xl bg-[#2563EB] flex items-center justify-center text-white shadow-lg shadow-blue-500/25 transition-transform hover:scale-105"
            >
              <Activity className="w-7 h-7 stroke-[2.5]" />
            </Link>
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}
