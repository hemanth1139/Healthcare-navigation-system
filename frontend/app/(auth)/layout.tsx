import React from "react";
import Link from "next/link";
import { HeartPulse, ShieldCheck, Stethoscope, MapPin, Sparkles, Activity } from "lucide-react";

const HIGHLIGHTS = [
  { icon: Stethoscope, text: "AI symptom triage in under 2 minutes" },
  { icon: MapPin, text: "Find nearby hospitals & specialists instantly" },
  { icon: ShieldCheck, text: "Government Scheme eligibility checking (RAG-based)" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex bg-slate-50 dark:bg-[#030712]">
      {/* Left Brand Panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-[46%] relative flex-col justify-between bg-gradient-to-br from-[#042F2E] via-[#0D9488] to-[#115E59] p-10 xl:p-14 overflow-hidden">
        {/* Animated background glow */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-teal-400/25 blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute bottom-10 left-10 w-72 h-72 rounded-full bg-emerald-400/20 blur-3xl" />

        {/* Floating background medical icons */}
        <div className="pointer-events-none absolute top-1/4 right-10 text-white/10 animate-bounce duration-1000">
          <Activity className="w-16 h-16" />
        </div>

        {/* Brand Header */}
        <Link href="/" className="relative flex items-center gap-3 focus-ring rounded-xl w-fit">
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-xl shadow-teal-900/30">
            <HeartPulse className="w-7 h-7 text-teal-200 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-heading font-bold text-2xl text-white tracking-tight block">
              HealthNav <span className="text-teal-300 font-extrabold">AI</span>
            </span>
            <span className="text-[11px] text-teal-100/70 font-medium tracking-wider uppercase">Indian Healthcare Portal</span>
          </div>
        </Link>

        {/* Hero content */}
        <div className="relative flex flex-col gap-6 max-w-md my-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-teal-100 font-medium w-fit">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            <span>AI Triage & Patient Navigation System</span>
          </div>
          <h2 className="font-heading text-3xl xl:text-4xl font-bold text-white leading-snug">
            Intelligent healthcare assistance for every Indian patient.
          </h2>
          <p className="text-sm text-teal-50/85 leading-relaxed">
            Assess symptoms with clinical accuracy, discover specialists & emergency hospitals, and instantly verify eligibility for 20+ central & state health schemes.
          </p>

          <ul className="flex flex-col gap-3.5 mt-2">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center text-teal-200 shrink-0">
                  <Icon className="w-4 h-4" />
                </span>
                <span className="text-sm text-white/95 font-medium">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="relative text-xs text-teal-100/60">
          &copy; {new Date().getFullYear()} HealthNav AI • Ministry of Health & Family Welfare Aligned
        </p>
      </div>

      {/* Right Form Container */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-10">
        {/* Mobile brand header */}
        <Link
          href="/"
          className="lg:hidden flex items-center gap-3 mb-8 focus-ring rounded-xl"
        >
          <div className="w-10 h-10 rounded-xl bg-[#0D9488] flex items-center justify-center text-white shadow-md shadow-teal-500/25">
            <HeartPulse className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="font-heading font-bold text-xl text-slate-900 dark:text-white tracking-tight">
            HealthNav <span className="text-[#0D9488]">AI</span>
          </span>
        </Link>

        <main className="w-full max-w-[420px]">{children}</main>
      </div>
    </div>
  );
}

