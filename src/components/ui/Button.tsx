import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  disabled = false,
  className,
  children,
  ...props
}) => {
  const baseClasses =
    "inline-flex cursor-pointer items-center justify-center font-medium transition-all duration-200 focus:outline-none border border-gray-border ";

  const variantClasses = {
    primary:
      "bg-bg-button-primary cursor-pointer text-text-button-primary hover:bg-bg-button-primary-hover focus:ring-border-focus",
    secondary:
      "bg-bg-button-secondary text-text-button-secondary hover:bg-bg-button-secondary-hover focus:ring-border-focus",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const disabledClasses = disabled
    ? "bg-bg-button-disabled text-text-disabled cursor-not-allowed"
    : "";

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        disabledClasses,
        "hover:scale-105 active:scale-95 focus:scale-105",
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

