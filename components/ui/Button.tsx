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
      "inline-flex items-center justify-center font-heading font-semibold transition-all duration-150 focus-ring disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer select-none rounded-xl active:scale-95";

    const variantStyles = {
      primary:
        "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-blue-500/25",
      secondary:
        "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800",
      ghost:
        "bg-transparent text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40",
      urgent:
        "bg-gradient-to-r from-[#EF4444] to-[#F43F5E] hover:from-[#DC2626] hover:to-[#E11D48] text-white shadow-md hover:shadow-rose-500/25",
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
