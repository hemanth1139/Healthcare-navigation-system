import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./Button";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Unable to load data",
  message = "A temporary network or server error occurred. Please try again.",
  onRetry,
  className = "",
}) => {
  return (
    <div
      role="alert"
      className={`bg-[#FDF0EE] dark:bg-[#2C1A18] border-2 border-[#E5573F]/40 dark:border-[#E5573F]/60 rounded-2xl p-6 sm:p-8 text-center flex flex-col items-center justify-center gap-3 shadow-xs ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-[#E5573F] text-white flex items-center justify-center shadow-xs">
        <AlertCircle className="w-6 h-6" />
      </div>

      <div className="flex flex-col gap-1 max-w-md">
        <h3 className="font-heading font-bold text-base text-[#1E2A2E] dark:text-[#F7FAFA]">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-[#5C6B6E] dark:text-[#A3B2B5] leading-relaxed">
          {message}
        </p>
      </div>

      {onRetry && (
        <Button onClick={onRetry} variant="secondary" size="md" className="mt-2 border-[#E5573F]/40 text-[#E5573F]">
          <RefreshCw className="w-4 h-4 mr-1.5" />
          Retry Request
        </Button>
      )}
    </div>
  );
};
