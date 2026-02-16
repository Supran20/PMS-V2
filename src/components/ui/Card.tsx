import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated";
}

export const Card: React.FC<CardProps> = ({
  variant = "default",
  className,
  children,
  ...props
}) => {
  const baseClasses =
    "rounded-lg border transition-all duration-300 animate-fade-in";

  const variantClasses = {
    default:
      "bg-bg-card border-border-card text-text-primary dark:bg-bg-card dark:border-border-card dark:text-text-primary",
    elevated:
      "bg-bg-card border-border-card shadow-lg text-text-primary dark:bg-bg-card dark:border-border-card dark:text-text-primary dark:shadow-xl",
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        "hover:shadow-md dark:hover:shadow-lg",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardHeader: React.FC<CardHeaderProps> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn("p-6 pb-4", className)} {...props}>
    {children}
  </div>
);

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardContent: React.FC<CardContentProps> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn("p-6 pt-0", className)} {...props}>
    {children}
  </div>
);

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardFooter: React.FC<CardFooterProps> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn("p-6 pt-4 flex items-center", className)} {...props}>
    {children}
  </div>
);
