import React, { InputHTMLAttributes, forwardRef, ReactNode } from "react";
import { FormError } from "./FormError";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      containerClassName = "",
      className = "",
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name || Math.random().toString(36).substring(2, 9);
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const describedBy = [
      error ? errorId : null,
      helperText ? helperId : null,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={`flex flex-col gap-1.5 w-full ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[#1E2A2E] flex items-center justify-between"
          >
            <span>
              {label}
              {required && <span className="text-[#E5573F] ml-1">*</span>}
            </span>
          </label>
        )}

        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3.5 text-[#5C6B6E] pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={describedBy || undefined}
            className={`w-full font-body text-sm text-[#1E2A2E] bg-white placeholder-[#5C6B6E]/60 border rounded-xl transition-all duration-200 focus-ring py-2.5 ${
              leftIcon ? "pl-10" : "pl-3.5"
            } ${rightIcon ? "pr-10" : "pr-3.5"} ${
              error
                ? "border-[#E5573F] focus-ring-urgent"
                : "border-[#E6F4F3] hover:border-[#0F6E7A]/40 focus:border-[#0F6E7A]"
            } ${disabled ? "bg-gray-100 opacity-70 cursor-not-allowed" : ""} ${className}`}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>

        {helperText && !error && (
          <p id={helperId} className="text-xs text-[#5C6B6E] mt-0.5">
            {helperText}
          </p>
        )}

        {error && <FormError id={errorId} message={error} className="mt-0.5" />}
      </div>
    );
  }
);

Input.displayName = "Input";
