import React, { ButtonHTMLAttributes, forwardRef } from "react";
import { Spinner } from "./Spinner";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "urgent";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      fullWidth = false,
      disabled,
      className = "",
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-heading font-semibold transition-colors duration-150 focus-ring disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer select-none rounded-lg active:scale-[0.98]";

    const variantStyles = {
      primary: "bg-teal-600 hover:bg-teal-700 text-white",
      secondary:
        "bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800",
      ghost:
        "bg-transparent text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40",
      urgent: "bg-[#EF4444] hover:bg-[#DC2626] text-white",
    };

    const sizeStyles = {
      sm: "px-3.5 py-2 text-xs sm:text-sm min-h-[38px]",
      md: "px-4 py-2.5 text-sm md:text-base min-h-[46px]",
      lg: "px-6 py-3.5 text-base md:text-lg min-h-[54px]",
    };

    const widthStyles = fullWidth ? "w-full" : "";

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <Spinner
              size={size === "lg" ? "md" : "sm"}
              color={variant === "primary" || variant === "urgent" ? "white" : "primary"}
            />
            <span className="opacity-90">{children}</span>
          </div>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
