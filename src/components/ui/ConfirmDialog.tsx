"use client";

import React from "react";
import Dialog from "@mui/material/Dialog";
import { Icon } from "@iconify/react";
import clsx from "clsx";

export type ConfirmTone = "primary" | "danger" | "warning" | "success";

export const TONES: Record<
  ConfirmTone,
  { badge: string; button: string; defaultIcon: string }
> = {
  primary: {
    badge: "bg-blue-50 text-blue-600",
    button: "bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-300",
    defaultIcon: "mdi:help-circle-outline",
  },
  danger: {
    badge: "bg-red-50 text-red-600",
    button: "bg-red-600 hover:bg-red-700 focus-visible:ring-red-300",
    defaultIcon: "mdi:alert-outline",
  },
  warning: {
    badge: "bg-amber-50 text-amber-600",
    button: "bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-300",
    defaultIcon: "mdi:alert-circle-outline",
  },
  success: {
    badge: "bg-green-50 text-green-600",
    button: "bg-green-600 hover:bg-green-700 focus-visible:ring-green-300",
    defaultIcon: "mdi:check-circle-outline",
  },
};

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  /** Entity name shown in a highlighted pill, e.g. the channel or admin name. */
  highlight?: string;
  tone?: ConfirmTone;
  /** Iconify icon name. Falls back to a tone-based default. */
  icon?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  highlight,
  tone = "danger",
  icon,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
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
      aria-labelledby="confirm-dialog-title"
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
      <div className="p-6 text-center">
        <div
          className={clsx(
            "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full",
            styles.badge,
          )}
        >
          <Icon icon={icon ?? styles.defaultIcon} className="text-3xl" />
        </div>

        <h2
          id="confirm-dialog-title"
          className="text-lg font-semibold text-gray-900"
        >
          {title}
        </h2>

        {highlight && (
          <p className="mt-3 inline-block max-w-full truncate rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
            {highlight}
          </p>
        )}

        {description && (
          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            {description}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={clsx(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-70",
              styles.button,
            )}
          >
            {loading && (
              <Icon icon="mdi:loading" className="animate-spin text-base" />
            )}
            {loading ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
