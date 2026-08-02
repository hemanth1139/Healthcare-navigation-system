import React, { HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  interactive = false,
  className = "",
  ...props
}) => {
  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-card ${
        interactive
          ? "border-2 border-slate-200 dark:border-slate-800 hover:border-blue-600 dark:hover:border-blue-500 hover:shadow-hover hover:-translate-y-1 transition-all duration-200"
          : "border border-slate-200 dark:border-slate-800"
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
