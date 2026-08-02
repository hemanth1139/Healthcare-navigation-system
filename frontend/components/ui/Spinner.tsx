import React from "react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  color?: "primary" | "white" | "urgent";
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = "md",
  className = "",
  color = "primary",
}) => {
  const sizeMap = {
    sm: "w-4 h-4 border-2",
    md: "w-5 h-5 border-2",
    lg: "w-8 h-8 border-3",
  };

  const colorMap = {
    primary: "border-blue-600 border-t-transparent",
    white: "border-white border-t-transparent",
    urgent: "border-red-500 border-t-transparent",
  };

  return (
    <div
      className={`inline-block animate-spin rounded-full ${sizeMap[size]} ${colorMap[color]} ${className}`}
      role="status"
      aria-label="Loading..."
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};
