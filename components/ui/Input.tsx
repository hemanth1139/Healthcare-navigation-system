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
            className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between"
          >
            <span>
              {label}
              {required && <span className="text-rose-500 ml-1">*</span>}
            </span>
          </label>
        )}

        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center justify-center w-4 h-4 z-10">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={describedBy || undefined}
            className={`w-full font-body text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-[#1E293B] placeholder:text-slate-400 border rounded-xl transition-all duration-200 py-3 ${
              leftIcon ? "pl-10" : "pl-3.5"
            } ${rightIcon ? "pr-10" : "pr-3.5"} ${
              error
                ? "border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/15"
                : "border-slate-200 dark:border-slate-700 hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
            } ${disabled ? "bg-slate-100 dark:bg-slate-800 opacity-70 cursor-not-allowed" : ""} ${className}`}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center z-10">
              {rightIcon}
            </div>
          )}
        </div>

        {helperText && !error && (
          <p id={helperId} className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {helperText}
          </p>
        )}

        {error && <FormError id={errorId} message={error} className="mt-0.5" />}
      </div>
    );
  }
);

Input.displayName = "Input";
