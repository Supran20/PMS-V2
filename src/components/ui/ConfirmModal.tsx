"use client";

import React, { useState } from "react";
import { Button } from "./Button";

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

  if (!open || !item) return null;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm(item);
    } finally {
      setLoading(false);
    }
  };

  const confirmClasses =
    confirmVariant === "danger"
      ? "bg-red-600 text-white"
      : "bg-blue-600 text-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#00000040]">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <h3
          className={`text-lg font-semibold mb-4 ${
            confirmVariant === "danger" ? "text-red-600" : "text-blue-600"
          }`}
        >
          {title}
        </h3>

        <p className="mb-6 text-sm text-gray-600">{description}</p>

        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            className="rounded-md border-gray-400 "
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            className={confirmClasses}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Processing..." : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

