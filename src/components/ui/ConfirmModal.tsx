"use client";

import React, { useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";

type ConfirmModalProps<T> = {
  open: boolean;
  item: T | null;
  onClose: () => void;
  onConfirm: (item: T) => Promise<void>;

  title: string;
  description: string;

  confirmText?: string;
  confirmVariant?: "primary" | "danger";
};

export function ConfirmModal<T>({
  open,
  item,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  confirmVariant = "primary",
}: ConfirmModalProps<T>) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!item) return;

    try {
      setLoading(true);
      await onConfirm(item);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfirmDialog
      open={open && !!item}
      tone={confirmVariant}
      title={title}
      description={description}
      confirmLabel={confirmText}
      loading={loading}
      onConfirm={handleConfirm}
      onClose={onClose}
    />
  );
}
