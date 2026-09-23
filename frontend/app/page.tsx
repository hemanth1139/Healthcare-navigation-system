"use client";

import React from "react";
import Link from "next/link";
import {
  HeartPulse,
  Bot,
  MapPin,
  FileCheck,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Building2,
  CheckCircle2,
  Users,
  Award,
  ChevronRight,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 focus-ring rounded-xl">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0D9488] to-[#14B8A6] flex items-center justify-center text-white shadow-md shadow-teal-500/20">
            <HeartPulse className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-heading font-bold text-xl tracking-tight block">
              HealthNav <span className="text-[#0D9488] dark:text-[#14B8A6]">AI</span>
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wider uppercase">Indian Healthcare Portal</span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-[#0D9488] dark:hover:text-[#14B8A6] transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#0D9488] hover:bg-[#0F766E] text-white shadow-md shadow-teal-500/25 transition-all hover:shadow-lg hover:shadow-teal-500/35"
          >
            Get Started Free
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center flex flex-col items-center">
        {/* Background ambient glow */}
        <div className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-teal-500/10 dark:bg-teal-500/15 blur-3xl rounded-full" />

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 dark:bg-teal-400/10 border border-teal-500/20 text-xs font-semibold text-[#0D9488] dark:text-[#14B8A6] mb-8">
          <Sparkles className="w-4 h-4" />
          <span>Clinical Rule Engine & RAG Scheme Verification</span>
        </div>

        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white max-w-4xl leading-[1.15] tracking-tight">
          AI-Powered <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0D9488] via-[#14B8A6] to-teal-700 dark:to-teal-300">Healthcare Navigation</span> for Indian Patients
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
          Assess symptoms with AI clinical precision, discover emergency hospitals & top specialists near you, and instantly check eligibility for 20+ government health schemes like Ayushman Bharat.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-base bg-[#0D9488] hover:bg-[#0F766E] text-white shadow-lg shadow-teal-500/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
          >
            <span>Start Symptom Check</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="#features"
            className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-base bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all"
          >
            Learn More
          </Link>
        </div>

        {/* Floating Trust Banner */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#0D9488]" /> Verified Medical Knowledge</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Ayushman Bharat (PM-JAY) Grounded</span>
          <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-teal-500" /> Multi-lingual Support</span>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Three Core Healthcare Pillars
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Everything a patient needs in one seamless AI assistant portal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="card-clinical-interactive p-8 flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-[#0D9488] dark:text-[#14B8A6] flex items-center justify-center mb-6">
                <Bot className="w-7 h-7" />
              </div>
              <h3 className="font-heading text-xl font-bold text-slate-900 dark:text-white mb-3">
                1. Symptom Assessment
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Interactive AI chat that analyzes primary & associated symptoms, flags emergency warning signs, and outputs clinical severity ratings with differential diagnoses.
              </p>
            </div>
            <Link href="/login" className="mt-8 text-xs font-bold text-[#0D9488] dark:text-[#14B8A6] flex items-center gap-1 hover:gap-2 transition-all">
              <span>Try Symptom Chat</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Feature 2 */}
          <div className="card-clinical-interactive p-8 flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-[#0D9488] dark:text-[#14B8A6] flex items-center justify-center mb-6">
                <MapPin className="w-7 h-7" />
              </div>
              <h3 className="font-heading text-xl font-bold text-slate-900 dark:text-white mb-3">
                2. Hospital Finder
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Search nearby government & private hospitals by specialty, distance radius, emergency room availability, drive times, and direct Google Maps directions.
              </p>
            </div>
            <Link href="/login" className="mt-8 text-xs font-bold text-[#0D9488] dark:text-[#14B8A6] flex items-center gap-1 hover:gap-2 transition-all">
              <span>Locate Hospitals</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Feature 3 */}
          <div className="card-clinical-interactive p-8 flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-[#0D9488] dark:text-[#14B8A6] flex items-center justify-center mb-6">
                <FileCheck className="w-7 h-7" />
              </div>
              <h3 className="font-heading text-xl font-bold text-slate-900 dark:text-white mb-3">
                3. Scheme Eligibility
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                RAG-powered analysis against official government guidelines. Get clear status breakdown (Eligible/Ineligible) with cited document source pages.
              </p>
            </div>
            <Link href="/login" className="mt-8 text-xs font-bold text-[#0D9488] dark:text-[#14B8A6] flex items-center gap-1 hover:gap-2 transition-all">
              <span>Check Eligibility</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-slate-100/70 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              How It Works
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Four simple steps from initial symptoms to verified healthcare resolution.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Describe Symptoms",
                desc: "Type or speak your symptoms in natural language (English/Hindi).",
                icon: Bot,
              },
              {
                step: "02",
                title: "Get Assessment",
                desc: "Receive clinical severity assessment, differential diagnosis, and urgency level.",
                icon: Stethoscope,
              },
              {
                step: "03",
                title: "Find Specialist",
                desc: "Discover recommended doctor specialties and nearest equipped hospitals.",
                icon: Building2,
              },
              {
                step: "04",
                title: "Check Schemes",
                desc: "Verify if your treatment is covered by Ayushman Bharat or State schemes.",
                icon: FileCheck,
              },
            ].map((s) => (
              <div key={s.step} className="card-clinical p-6 relative flex flex-col justify-between">
                <span className="text-xs font-extrabold text-[#0D9488] dark:text-[#14B8A6] tracking-wider uppercase mb-4 block">
                  Step {s.step}
                </span>
                <s.icon className="w-8 h-8 text-slate-700 dark:text-slate-300 mb-4" />
                <h4 className="font-heading text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {s.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="card-clinical p-8">
            <span className="font-heading text-4xl sm:text-5xl font-extrabold text-[#0D9488] dark:text-[#14B8A6] block mb-2">
              12+
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block mb-1">
              Disease Categories
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Cardiovascular, Respiratory, Gastro, Metabolic, etc.
            </span>
          </div>

          <div className="card-clinical p-8">
            <span className="font-heading text-4xl sm:text-5xl font-extrabold text-[#0D9488] dark:text-[#14B8A6] block mb-2">
              20+
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block mb-1">
              Government Schemes
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Ayushman Bharat (PM-JAY), State Health Insurance, Senior Citizen
            </span>
          </div>

          <div className="card-clinical p-8">
            <span className="font-heading text-4xl sm:text-5xl font-extrabold text-[#0D9488] dark:text-[#14B8A6] block mb-2">
              Real-time
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block mb-1">
              Hospital Search
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              GPS radius auto-detect, emergency room filters & directions
            </span>
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full mb-16">
        <div className="rounded-3xl bg-gradient-to-r from-[#042F2E] via-[#0D9488] to-[#115E59] p-8 sm:p-12 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="pointer-events-none absolute -right-10 -bottom-10 w-64 h-64 bg-teal-400/20 rounded-full blur-2xl" />
          <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-4">
            Ready for instant healthcare guidance?
          </h2>
          <p className="text-sm sm:text-base text-teal-100 max-w-xl mx-auto mb-8">
            Create your free account today and access intelligent symptom triage, hospital mapping, and government scheme eligibility tools.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-slate-900 bg-white hover:bg-teal-50 transition-all shadow-lg hover:scale-105"
          >
            <span>Create Free Account</span>
            <ArrowRight className="w-5 h-5 text-[#0D9488]" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-8 px-4 sm:px-8 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-[#0D9488]" />
            <span className="font-bold text-slate-800 dark:text-slate-200">HealthNav AI</span>
            <span>• Healthcare Navigation Portal</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">About System</Link>
            <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">Contact Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

