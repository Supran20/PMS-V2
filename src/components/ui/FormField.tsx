import React from "react";

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  required = false,
  children,
  className = "",
}: FormFieldProps) {
  return (
    <div
      className={`flex flex-col md:flex-row md:items-start gap-2 md:gap-4 ${className}`}
    >
      <label className="md:w-1/4 text-sm font-semibold text-gray-700 dark:text-gray-300 pt-2">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>

      <div className="md:w-3/4 flex flex-col gap-1">{children}</div>
    </div>
  );
}
