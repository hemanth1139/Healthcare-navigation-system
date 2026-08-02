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
          {icon && <div className="text-[#0F6E7A] dark:text-[#25A0B0]">{icon}</div>}
          <h2 className="font-heading font-bold text-lg text-[#1E2A2E] dark:text-[#F7FAFA]">
            {title}
          </h2>
        </div>
        <p className="text-xs text-[#5C6B6E] dark:text-[#A3B2B5]">{description}</p>
      </div>

      <Card className="p-5 sm:p-6 border-2 border-[#E6F4F3] dark:border-[#25363B] bg-white dark:bg-[#1A262A] shadow-xs">
        {children}
      </Card>
    </section>
  );
};
