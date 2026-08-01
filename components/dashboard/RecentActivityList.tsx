import React from "react";
import Link from "next/link";
import { Activity, FileText, UserCheck, ShieldAlert, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ActivityItem } from "@/lib/mockData";

const categoryIconMap = {
  prediction: Activity,
  record: FileText,
  consultation: UserCheck,
  scheme: ShieldAlert,
};

export const RecentActivityList: React.FC<{ activities: ActivityItem[] }> = ({ activities }) => {
  return (
    <Card className="flex flex-col gap-4 p-5 sm:p-6">
      <div className="flex items-center justify-between border-b border-[#E6F4F3] pb-3">
        <div>
          <h2 className="font-heading font-bold text-base text-[#1E2A2E]">
            Recent Activity & Triage Logs
          </h2>
          <p className="text-xs text-[#5C6B6E]">
            Latest interactions, consultations, and document uploads
          </p>
        </div>

        <Link
          href="/predictions"
          className="text-xs font-semibold text-[#0F6E7A] hover:underline focus-ring rounded px-1 py-0.5"
        >
          View All Logs
        </Link>
      </div>

      <div className="divide-y divide-[#E6F4F3]">
        {activities.map((item) => {
          const CategoryIcon = categoryIconMap[item.category] || Activity;

          return (
            <div
              key={item.id}
              className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group hover:bg-[#F7FAFA] p-2 rounded-xl transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#E6F4F3] text-[#0F6E7A] flex items-center justify-center shrink-0 mt-0.5">
                  <CategoryIcon className="w-4 h-4" />
                </div>

                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-semibold text-sm text-[#1E2A2E]">
                      {item.title}
                    </h3>
                    <span className="text-[10px] font-mono text-[#5C6B6E] bg-[#E6F4F3]/60 px-2 py-0.5 rounded-md">
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#5C6B6E] line-clamp-1">{item.details}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                <span className="text-xs font-mono text-[#5C6B6E]">{item.timestamp}</span>
                <Link
                  href={item.linkUrl}
                  className="p-1.5 rounded-lg text-[#0F6E7A] hover:bg-[#E6F4F3] transition-colors focus-ring"
                  title="View details"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
