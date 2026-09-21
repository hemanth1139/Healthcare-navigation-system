import React from "react";
import Link from "next/link";
import { ShieldCheck, AlertTriangle, ArrowRight, Activity } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { HealthStatusSummary } from "@/lib/mockData";

export const StatusSummaryCard: React.FC<{ status: HealthStatusSummary }> = ({ status }) => {
  const isUrgent = status.severity === "urgent";
  const isModerate = status.severity === "moderate";

  if (status.hasActiveConcern && (isUrgent || isModerate)) {
    return (
      <Card className={`border-2 ${isUrgent ? "border-red-500 bg-red-50" : "border-teal-600/40 bg-teal-50/50"}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isUrgent ? "bg-red-500 text-white" : "bg-teal-600 text-white"}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isUrgent ? "bg-red-500 text-white" : "bg-teal-600 text-white"}`}>
                  {isUrgent ? "Emergency Alert" : "Active Concern"}
                </span>
                <span className="text-xs text-[#64748B] font-mono">{status.lastChecked}</span>
              </div>
              <h3 className="font-heading font-bold text-lg text-[#0F172A]">
                {status.title}
              </h3>
              <p className="text-xs text-[#64748B] max-w-xl leading-relaxed">
                {status.description}
              </p>
            </div>
          </div>

          {status.actionText && status.actionUrl && (
            <Link href={status.actionUrl} className="w-full sm:w-auto shrink-0">
              <Button variant={isUrgent ? "urgent" : "primary"} size="md" fullWidth>
                <span>{status.actionText}</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </Card>
    );
  }

  // All-Clear / Neutral State
  return (
    <Card className="border border-[#F0FDFA] bg-white">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                Status: All Clear
              </span>
              <span className="text-xs text-[#64748B] font-mono">{status.lastChecked}</span>
            </div>
            <h3 className="font-heading font-semibold text-base text-[#0F172A]">
              {status.title}
            </h3>
            <p className="text-xs text-[#64748B] max-w-2xl leading-relaxed">
              {status.description}
            </p>
          </div>
        </div>

        {status.actionText && status.actionUrl && (
          <Link href={status.actionUrl} className="w-full sm:w-auto shrink-0">
            <Button variant="secondary" size="sm" fullWidth>
              <Activity className="w-4 h-4 mr-1.5" />
              <span>{status.actionText}</span>
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );
};
