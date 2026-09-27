"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Sparkles, MapPin, Calendar, IndianRupee, ArrowRight, ShieldCheck } from "lucide-react";

export interface QuickIntakeData {
  state: string;
  age: number;
  annual_income: string;
}

export interface QuickEligibilityIntakeCardProps {
  initialState?: string;
  initialAge?: number;
  initialIncome?: string;
  isLoading?: boolean;
  onSubmit: (data: QuickIntakeData) => void;
  onCancel?: () => void;
}

const INDIAN_STATES = [
  "Tamil Nadu",
  "Central / All India",
  "Andhra Pradesh",
  "Telangana",
  "Karnataka",
  "Kerala",
  "Maharashtra",
  "Gujarat",
  "West Bengal",
  "Rajasthan",
  "Punjab",
  "Haryana",
  "Odisha",
  "Delhi (UT)",
  "Uttar Pradesh",
  "Madhya Pradesh",
  "Bihar",
  "Other State/UT",
];

export const QuickEligibilityIntakeCard: React.FC<QuickEligibilityIntakeCardProps> = ({
  initialState = "Tamil Nadu",
  initialAge,
  initialIncome,
  isLoading = false,
  onSubmit,
  onCancel,
}) => {
  const [selectedState, setSelectedState] = useState<string>(initialState);
  const [age, setAge] = useState<string>(initialAge ? String(initialAge) : "");
  const [incomeTier, setIncomeTier] = useState<"BPL" | "ABOVE_BPL" | "">(
    initialIncome === "BPL" || initialIncome === "50000"
      ? "BPL"
      : initialIncome
      ? "ABOVE_BPL"
      : "BPL"
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 125) {
      setError("Please enter a valid age between 0 and 125.");
      return;
    }

    if (!incomeTier) {
      setError("Please select an income bracket.");
      return;
    }

    onSubmit({
      state: selectedState,
      age: parsedAge,
      annual_income: incomeTier === "BPL" ? "50000" : "250000",
    });
  };

  return (
    <Card className="p-5 sm:p-6 border-2 border-[#0D9488]/40 bg-gradient-to-br from-teal-500/5 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 shadow-clinical-lg rounded-2xl flex flex-col gap-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-teal-500/10 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0D9488] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-[#0D9488] px-2 py-0.5 rounded-full">
                Eligibility Intake
              </span>
            </div>
            <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-white mt-0.5">
              Quick Eligibility Questionnaire
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Please provide your basic details so we can analyze all eligible government schemes for you.
            </p>
          </div>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            ✕ Dismiss
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs px-3 py-2 rounded-xl">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. State Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#0D9488]" />
              <span>State / UT of Residence</span>
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="text-xs sm:text-sm border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#0D9488]"
            >
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Age Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#0D9488]" />
              <span>Current Age (Years)</span>
            </label>
            <input
              type="number"
              min="0"
              max="125"
              placeholder="e.g. 65 (or 72 for senior citizen schemes)"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="text-xs sm:text-sm border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#0D9488]"
              required
            />
          </div>
        </div>

        {/* 3. Income Selector Buttons */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <IndianRupee className="w-3.5 h-3.5 text-[#0D9488]" />
            <span>Annual Household Income Bracket</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setIncomeTier("BPL")}
              className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                incomeTier === "BPL"
                  ? "bg-teal-500/10 border-[#0D9488] text-teal-900 dark:text-teal-200 ring-2 ring-teal-500/20"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                  incomeTier === "BPL" ? "border-[#0D9488] bg-[#0D9488]" : "border-slate-400"
                }`}
              >
                {incomeTier === "BPL" && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
              </div>
              <div>
                <div className="text-xs font-bold">Up to ₹1,20,000 / year</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  (Or valid BPL / Yellow Ration Card / Low Income)
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIncomeTier("ABOVE_BPL")}
              className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                incomeTier === "ABOVE_BPL"
                  ? "bg-teal-500/10 border-[#0D9488] text-teal-900 dark:text-teal-200 ring-2 ring-teal-500/20"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                  incomeTier === "ABOVE_BPL" ? "border-[#0D9488] bg-[#0D9488]" : "border-slate-400"
                }`}
              >
                {incomeTier === "ABOVE_BPL" && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
              </div>
              <div>
                <div className="text-xs font-bold">Above ₹1,20,000 / year</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  (Middle / higher income bracket)
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0D9488]" />
            <span>Instant assessment grounded in official scheme rules</span>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            className="px-5 py-2.5 text-xs font-bold"
          >
            <span>Check My Eligibility</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>
      </form>
    </Card>
  );
};
