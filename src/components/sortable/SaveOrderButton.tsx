"use client";

import React, { useState } from "react";
import { Button } from "../ui/Button";
import { toast } from "sonner";

type SaveOrderButtonProps<T> = {
  items: T[];
  onSaveOrder: (items: T[]) => Promise<void>;
  orderDirty: boolean;
  setOrderDirty: (dirty: boolean) => void;
  className?: string;
};

export function SaveOrderButton<T>({
  items,
  onSaveOrder,
  orderDirty,
  setOrderDirty,
  className,
}: SaveOrderButtonProps<T>) {
  const [saving, setSaving] = useState(false);

  const handleClick = async () => {
    setSaving(true);
    try {
      await onSaveOrder(items);
      toast.success("Order saved successfully");
      setOrderDirty(false);
    } catch (err) {
      toast.error("Failed to save order");
    } finally {
      setSaving(false);
    }
  };

  if (!orderDirty) return null;

  return (
    <div className="flex justify-end mb-3">
      <Button
        onClick={handleClick}
        disabled={saving}
        className={`bg-green-600 text-white rounded-2xl mt-4 ${className || ""}`}
      >
        {saving ? "Saving order..." : "Save Order"}
      </Button>
    </div>
  );
}

