// components/form/FormInput.tsx

import { Controller } from "react-hook-form";
import type { FieldValues, Control, Path } from "react-hook-form";

export interface FormInputProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T, any>;
  placeholder?: string;
  type?: string;
  className?: string;
  as?: "input" | "textarea";
  rows?: number;
  onBlur?: () => void;
}

export function FormInput<T extends FieldValues>({
  name,
  control,
  placeholder,
  type = "text",
  className = "",
  as = "input",
  rows = 3,
  onBlur,
}: FormInputProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <>
          {as === "textarea" ? (
            <textarea
              {...field}
              rows={rows}
              placeholder={placeholder}
              onBlur={(e) => {
                field.onBlur();
                onBlur?.();
              }}
              className={`w-full px-3 py-2 text-sm rounded-md border border-gray-300 
              bg-gray-50 placeholder:text-gray-500 text-gray-800
              focus:ring-2 focus:ring-blue-500 ${className}`}
            />
          ) : (
            <input
              {...field}
              type={type}
              placeholder={placeholder}
              onBlur={(e) => {
                field.onBlur();
                onBlur?.();
              }}
              className={`w-full px-3 py-2 text-sm rounded-md border border-gray-300 
              bg-gray-50 placeholder:text-gray-500 text-gray-800
              focus:ring-1 focus:ring-red-400 ${className}`}
            />
          )}

          {fieldState.error && (
            <p className="text-red-600 text-sm mt-1">
              {fieldState.error.message}
            </p>
          )}
        </>
      )}
    />
  );
}
