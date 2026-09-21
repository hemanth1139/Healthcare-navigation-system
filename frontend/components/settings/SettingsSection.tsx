import React from "react";
import { Card } from "@/components/ui/Card";

export interface SettingsSectionProps {
  id?: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  id,
  title,
  description,
  icon,
  children,
  className = "",
}) => {
  return (
    <section id={id} className={`flex flex-col gap-3 ${className}`}>
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          {icon && <div className="text-[#0D9488] dark:text-[#14B8A6]">{icon}</div>}
          <h2 className="font-heading font-bold text-lg text-[#0F172A] dark:text-[#F8FAFC]">
            {title}
          </h2>
        </div>
        <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{description}</p>
      </div>

      <Card className="p-5 sm:p-6 border-2 border-[#F0FDFA] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] shadow-xs">
        {children}
      </Card>
    </section>
  );
};
