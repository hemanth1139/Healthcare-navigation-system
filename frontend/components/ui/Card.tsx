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
      className={`bg-white dark:bg-slate-900 rounded-xl p-6 md:p-8 shadow-card border border-slate-200 dark:border-slate-800 ${
        interactive
          ? "hover:border-teal-600 dark:hover:border-teal-500 hover:shadow-hover transition-colors duration-150"
          : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
