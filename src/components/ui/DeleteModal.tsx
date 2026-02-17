"use client";

import React, { useState } from "react";
import { Button } from "./Button";
import { toast } from "sonner";

type DeleteModalProps<T> = {
  open: boolean;
  item: T | null;
  onClose: () => void;
  onConfirm: (item: T) => Promise<void>;
  titleKey?: keyof T; // optional: property to show as item name
  itemName?: string; // fallback name
};

export function DeleteModal<T>({
  open,
  item,
  onClose,
  onConfirm,
  titleKey,
  itemName,
}: DeleteModalProps<T>) {
  const [deleting, setDeleting] = useState(false);

  if (!open || !item) return null;

  const displayName =
    (titleKey ? (item[titleKey] as unknown as string) : undefined) ||
    itemName ||
    "this item";

  const handleConfirm = async () => {
    try {
      setDeleting(true);
      await onConfirm(item);
      toast.success(`${displayName} deleted successfully`);
      onClose();
    } catch {
      toast.error(`Failed to delete ${displayName}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#00000040]">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-red-600 mb-4">
          Delete {displayName}
        </h3>

        <p className="mb-6 text-sm text-gray-600">
          Are you sure you want to delete{" "}
          <span className="font-semibold">{displayName}</span>?
        </p>

        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            className="border-gray-400 rounded-md"
            onClick={onClose}
            disabled={deleting}
          >
            Cancel
          </Button>

          <Button
            className="bg-red-600 text-white border border-red-700 rounded-md"
            onClick={handleConfirm}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
