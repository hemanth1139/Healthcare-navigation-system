import React from "react";
import Link from "next/link";
import { Activity, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-[#F7FAFA] via-[#F0F8F7] to-[#E6F4F3] p-4 sm:p-6 md:p-8">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
        <Link
          href="/login"
          className="inline-flex items-center gap-2.5 group focus-ring rounded-xl p-1"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#0F6E7A] flex items-center justify-center text-white shadow-clinical transition-transform group-hover:scale-105">
            <Activity className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div className="flex flex-col items-start">
            <span className="font-heading font-bold text-xl sm:text-2xl text-[#1E2A2E] tracking-tight">
              HealthCare<span className="text-[#0F6E7A]">Navigator</span>
            </span>
            <span className="text-xs font-medium text-[#5C6B6E] tracking-wide uppercase">
              Clinical Portal
            </span>
          </div>
        </Link>
      </div>

      {/* Main Form Card Container */}
      <main className="w-full max-w-[440px]">
        <Card className="shadow-clinical-lg border-2 border-[#E6F4F3] relative overflow-hidden backdrop-blur-sm">
          {/* Subtle decorative top accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0F6E7A] to-[#25A0B0]" />
          {children}
        </Card>
      </main>

      {/* Footer Branding & Security Badge */}
      <footer className="mt-8 text-center flex flex-col items-center gap-2 text-xs text-[#5C6B6E]">
        <div className="flex items-center gap-1.5 font-medium text-[#0F6E7A] bg-[#E6F4F3]/80 px-3 py-1 rounded-full border border-[#0F6E7A]/15">
          <ShieldCheck className="w-4 h-4" />
          <span>256-Bit HIPAA Compliant Security</span>
        </div>
        <p className="mt-1">
          &copy; {new Date().getFullYear()} HealthCare Navigator Inc. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
