"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Stethoscope,
  Heart,
  Brain,
  Wind,
  Bone,
  Baby,
  Eye,
  Activity,
  Search,
  ArrowRight,
  ShieldCheck,
  Building,
} from "lucide-react";

export default function SpecialistsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const categories = [
    {
      name: "Cardiologist",
      icon: Heart,
      desc: "Specialists in heart health, blood pressure, coronary artery disease, and arrhythmia.",
      symptoms: ["Chest pain", "Palpitations", "High BP", "Shortness of breath"],
      hospitalCount: 14,
    },
    {
      name: "Neurologist",
      icon: Brain,
      desc: "Experts in brain, spinal cord, nerve disorders, severe migraines, and neuropathy.",
      symptoms: ["Severe headache", "Seizures", "Numbness", "Dizziness"],
      hospitalCount: 9,
    },
    {
      name: "Pulmonologist",
      icon: Wind,
      desc: "Respiratory system specialists treating asthma, COPD, pneumonia, and chronic cough.",
      symptoms: ["Chronic cough", "Wheezing", "Breathlessness", "Chest congestion"],
      hospitalCount: 11,
    },
    {
      name: "General Physician",
      icon: Stethoscope,
      desc: "Primary care medical doctors for overall health checkups, fever, and common ailments.",
      symptoms: ["Fever", "Fatigue", "Viral infection", "Routine checkup"],
      hospitalCount: 22,
    },
    {
      name: "Orthopedist",
      icon: Bone,
      desc: "Musculoskeletal experts treating bone fractures, joint pain, arthritis, and spine issues.",
      symptoms: ["Joint pain", "Fracture", "Back pain", "Swelling"],
      hospitalCount: 12,
    },
    {
      name: "Pediatrician",
      icon: Baby,
      desc: "Child health specialists providing vaccinations, growth monitoring, and pediatric care.",
      symptoms: ["Childhood fever", "Infant nutrition", "Vaccination"],
      hospitalCount: 15,
    },
    {
      name: "Ophthalmologist",
      icon: Eye,
      desc: "Eye care specialists for vision testing, cataract treatment, and eye infections.",
      symptoms: ["Blurry vision", "Eye pain", "Redness", "Cataract"],
      hospitalCount: 8,
    },
    {
      name: "Gastroenterologist",
      icon: Activity,
      desc: "Digestive system doctors for stomach ulcers, GERD, liver, and bowel disorders.",
      symptoms: ["Stomach burning", "Acidity", "Abdominal pain", "Indigestion"],
      hospitalCount: 10,
    },
  ];

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.symptoms.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Stethoscope className="w-7 h-7 text-[#0D9488]" />
            <span>Medical Specialists Directory</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Discover matched specialist departments near you based on your clinical assessment.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search specialty or symptom (e.g. Heart, Fever)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#0D9488]"
          />
        </div>
      </div>

      {/* Specialist Category Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filtered.map((cat, i) => {
          const Icon = cat.icon;
          return (
            <div
              key={i}
              className="card-clinical-interactive p-6 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-[#0D9488] dark:text-[#14B8A6] flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6" />
                </div>

                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                    {cat.name}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {cat.hospitalCount} Hospitals
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  {cat.desc}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-6">
                  {cat.symptoms.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-[10px] font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <Link
                href={`/hospitals?specialty=${encodeURIComponent(cat.name)}`}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-[#0D9488] hover:text-white dark:bg-slate-800 dark:hover:bg-[#0D9488] text-slate-800 dark:text-slate-200 text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5"
              >
                <span>Find {cat.name} Hospitals</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

