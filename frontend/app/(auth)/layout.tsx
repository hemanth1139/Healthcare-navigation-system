import React from "react";
import Link from "next/link";
import { HeartPulse, ShieldCheck, Stethoscope, MapPin } from "lucide-react";

const HIGHLIGHTS = [
  { icon: Stethoscope, text: "AI symptom triage in under 2 minutes" },
  { icon: MapPin, text: "Find nearby hospitals & specialists instantly" },
  { icon: ShieldCheck, text: "HIPAA-grade privacy on every record" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex bg-white dark:bg-[#020617]">
      {/* Left Brand Panel — hidden on small screens */}
      <div className="hidden lg:flex lg:w-[44%] relative flex-col justify-between bg-[#0B2E2C] p-10 xl:p-14 overflow-hidden">
        {/* Decorative gradient blobs */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-teal-500/25 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-72 h-72 rounded-full bg-emerald-400/10 blur-3xl" />

        {/* Brand mark */}
        <Link href="/login" className="relative flex items-center gap-3 focus-ring rounded-xl">
          <div className="w-11 h-11 rounded-2xl bg-teal-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/30">
            <HeartPulse className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="font-heading font-bold text-2xl text-white tracking-tight">
            MediNav
          </span>
        </Link>

        {/* Hero copy */}
        <div className="relative flex flex-col gap-6 max-w-md">
          <h2 className="font-heading text-3xl xl:text-4xl font-bold text-white leading-tight">
            Your care journey, guided end‑to‑end.
          </h2>
          <p className="text-sm text-teal-100/80 leading-relaxed">
            One place to check symptoms, find the right specialist, locate a
            hospital, and check eligibility for government health schemes.
          </p>

          <ul className="flex flex-col gap-3.5 mt-2">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-teal-200 shrink-0">
                  <Icon className="w-4 h-4" />
                </span>
                <span className="text-sm text-white/90 font-medium">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="relative text-xs text-teal-100/50">
          &copy; {new Date().getFullYear()} MediNav Health Systems
        </p>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10">
        {/* Mobile-only brand mark */}
        <Link
          href="/login"
          className="lg:hidden flex items-center gap-2.5 mb-8 focus-ring rounded-xl"
        >
          <div className="w-10 h-10 rounded-xl bg-[#0D9488] flex items-center justify-center text-white shadow-md shadow-teal-500/25">
            <HeartPulse className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="font-heading font-bold text-xl text-slate-900 dark:text-white tracking-tight">
            MediNav
          </span>
        </Link>

        <main className="w-full max-w-[400px]">{children}</main>
      </div>
    </div>
  );
}
