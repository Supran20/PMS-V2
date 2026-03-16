"use client";

import { useState, useEffect } from "react";
import { Interview } from "@/lib/api/interview";
import { toast } from "sonner";

interface PostEditModalProps {
  open: boolean;
  onClose: () => void;
  interview: Interview | null;
  onSubmit: (id: string, drive_link: string) => void;
}

export default function PostEditModal({
  open,
  onClose,
  interview,
  onSubmit,
}: PostEditModalProps) {
  const [driveLink, setDriveLink] = useState("");

  useEffect(() => {
    if (open && interview) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDriveLink(interview.google_drive_link ?? "");
    }
  }, [open, interview]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (open) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!interview) return;

    if (!driveLink.trim()) {
      toast.error("Please enter Google Drive link");
      return;
    }

    onSubmit(interview.id, driveLink);
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl p-6 w-[420px] space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold">Edited</h3>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-700">Google Drive Link</label>

          <input
            type="url"
            placeholder="https://drive.google.com/..."
            value={driveLink}
            onChange={(e) => setDriveLink(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-gray-50"
          />
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-1 bg-white text-gray-600 cursor-pointer transition text-xs rounded-md border hover:scale-[0.96]"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="px-4 py-1 bg-blue-600 text-white cursor-pointer transition text-xs rounded-md hover:bg-blue-700 hover:scale-[0.96]"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
