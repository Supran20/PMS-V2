"use client";

import { useState, useEffect } from "react";
import { Interview } from "@/lib/api/interview";
import { toast } from "sonner";

interface PostponeModalProps {
  open: boolean;
  onClose: () => void;
  interview: Interview | null;
  onSubmit: (id: string, date: string, start_time: string) => void;
}

export default function PostponeModal({
  open,
  onClose,
  interview,
  onSubmit,
}: PostponeModalProps) {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");

  useEffect(() => {
    if (open && interview) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDate(interview.interview_date ?? "");
      setStartTime(interview.start_time ?? "");
    }
  }, [open, interview]);

  // ESC key closes modal
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
    if (!date || !startTime) {
      toast.error("Please select date and time");
      return;
    }
    onSubmit(interview.id, date, startTime);
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl p-6 w-[400px] space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold">Postpone Interview</h3>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col text-sm text-gray-700">
            Interview Date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-gray-50"
            />
          </label>

          <label className="flex flex-col text-sm text-gray-700">
            Start Time
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-gray-50"
            />
          </label>
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
