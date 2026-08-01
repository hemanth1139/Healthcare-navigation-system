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
      className={`bg-white rounded-2xl p-6 md:p-8 shadow-[0_2px_12px_rgba(15,110,122,0.08)] ${
        interactive
          ? "border-2 border-[#E6F4F3] hover:border-[#0F6E7A] transition-all duration-200"
          : "border border-[#E6F4F3]"
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
