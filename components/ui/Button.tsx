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
      "inline-flex items-center justify-center font-heading font-semibold transition-all duration-200 focus-ring disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer select-none rounded-xl";

    const variantStyles = {
      primary:
        "bg-[#0F6E7A] text-white hover:bg-[#0B545D] active:bg-[#083E45] shadow-sm hover:shadow-clinical",
      secondary:
        "bg-[#E6F4F3] text-[#0F6E7A] hover:bg-[#D4ECE9] active:bg-[#C2E3DF] border border-[#0F6E7A]/20",
      ghost:
        "bg-transparent text-[#0F6E7A] hover:bg-[#E6F4F3]/60 active:bg-[#E6F4F3]",
      urgent:
        "bg-[#E5573F] text-white hover:bg-[#C9452F] active:bg-[#A83521] shadow-sm",
    };

    const sizeStyles = {
      sm: "px-3 py-1.5 text-sm min-h-[36px]",
      md: "px-4 py-2.5 text-sm md:text-base min-h-[44px]",
      lg: "px-6 py-3.5 text-base md:text-lg min-h-[52px]",
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
