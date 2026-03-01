"use client";

import React, { useState } from "react";
import { Button } from "./Button";
import { toast } from "sonner";
import { updateUser } from "@/lib/api/user";

type ChangePasswordModalProps = {
  open: boolean;
  userId: string | null;
  onClose: () => void;
};

export function ChangePasswordModal({
  open,
  userId,
  onClose,
}: ChangePasswordModalProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);

  if (!open || !userId) return null;

  const handleUpdate = async () => {
    if (!password || password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setUpdating(true);

      await updateUser(userId, { password });

      toast.success("Password updated successfully");
      setPassword("");
      setConfirmPassword("");
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update password");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#00000040]">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Change Password
        </h3>

        <input
          type="password"
          placeholder="Enter new password"
          className="w-full border border-gray-300 rounded-md p-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Re-enter new password"
          className="w-full border border-gray-300 rounded-md p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            className="border-gray-400 rounded-md"
            onClick={onClose}
            disabled={updating}
          >
            Cancel
          </Button>

          <Button
            className="bg-blue-600 text-white border border-blue-700 rounded-md"
            onClick={handleUpdate}
            disabled={updating}
          >
            {updating ? "Updating..." : "Update Password"}
          </Button>
        </div>
      </div>
    </div>
  );
}
