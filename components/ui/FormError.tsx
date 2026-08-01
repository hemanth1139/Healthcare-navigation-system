import React from "react";
import { AlertCircle } from "lucide-react";

interface FormErrorProps {
  message?: string;
  id?: string;
  className?: string;
}

export const FormError: React.FC<FormErrorProps> = ({ message, id, className = "" }) => {
  if (!message) return null;

  return (
    <div
      id={id}
      aria-live="polite"
      className={`flex items-center gap-1.5 text-xs font-medium text-[#E5573F] ${className}`}
    >
      <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
};
