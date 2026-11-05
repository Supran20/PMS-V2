"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "./ConfirmDialog";

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

  const realName =
    (item && titleKey ? (item[titleKey] as unknown as string) : undefined) ||
    itemName;
  const displayName = realName || "this item";

  const handleConfirm = async () => {
    if (!item) return;

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
    <ConfirmDialog
      open={open && !!item}
      tone="danger"
      icon="mdi:trash-can-outline"
      title="Delete this item?"
      highlight={realName}
      description="This action cannot be undone."
      confirmLabel="Delete"
      loading={deleting}
      onConfirm={handleConfirm}
      onClose={onClose}
    />
  );
}
