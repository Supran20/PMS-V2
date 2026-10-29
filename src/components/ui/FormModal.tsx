"use client";

import React from "react";
import Dialog from "@mui/material/Dialog";
import { Icon } from "@iconify/react";
import clsx from "clsx";
import { TONES, ConfirmTone } from "./ConfirmDialog";

interface FormModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  icon: string;
  tone?: Exclude<ConfirmTone, "danger">;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  /** Pass react-hook-form's handleSubmit(...) result here. */
  onSubmit: (e?: React.BaseSyntheticEvent) => void | Promise<void>;
  onClose: () => void;
  children: React.ReactNode;
}

export function FormModal({
  open,
  title,
  subtitle,
  icon,
  tone = "primary",
  submitLabel = "Save",
  cancelLabel = "Cancel",
  loading = false,
  onSubmit,
  onClose,
  children,
}: FormModalProps) {
  const styles = TONES[tone];

  // Block every way of dismissing the dialog while a request is running.
  const handleClose = () => {
    if (!loading) onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby="form-modal-title"
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: "16px",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.18)",
        },
        "& .MuiBackdrop-root": {
          backgroundColor: "rgba(17, 24, 39, 0.45)",
          backdropFilter: "blur(2px)",
        },
      }}
    >
      <form onSubmit={onSubmit} noValidate className="p-6">
        <div className="flex items-start gap-4">
          <div
            className={clsx(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
              styles.badge,
            )}
          >
            <Icon icon={icon} className="text-2xl" />
          </div>
          <div className="min-w-0">
            <h2
              id="form-modal-title"
              className="text-lg font-semibold text-gray-900"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 truncate text-sm text-gray-500">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 space-y-4">{children}</div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            disabled={loading}
            className={clsx(
              "inline-flex min-w-24 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-70",
              styles.button,
            )}
          >
            {loading && (
              <Icon icon="mdi:loading" className="animate-spin text-base" />
            )}
            {loading ? "Saving..." : submitLabel}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

/** Label + input slot + inline error, shared by the form modals. */
export function FormModalField({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export const formInputClass = (hasError: boolean) =>
  clsx(
    "w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2",
    hasError
      ? "border-red-400 focus:ring-red-200"
      : "border-gray-300 focus:ring-blue-200",
  );
