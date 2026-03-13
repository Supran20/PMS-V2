"use client";

import { useState, useEffect } from "react";
import { Interview } from "@/lib/api/interview";
import { toast } from "sonner";

interface PublishModalProps {
  open: boolean;
  onClose: () => void;
  interview: Interview | null;
  onSubmit: (id: string, youtube_link: string) => void;
}

export default function PublishModal({
  open,
  onClose,
  interview,
  onSubmit,
}: PublishModalProps) {
  const [youtubeLink, setYoutubeLink] = useState("");

  useEffect(() => {
    if (open && interview) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setYoutubeLink(interview.youtube_link ?? "");
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

  function normalizeYoutubeUrl(url: string): string {
    try {
      const u = new URL(url);

      // handle embed link
      if (
        u.hostname.includes("youtube.com") &&
        u.pathname.includes("/embed/")
      ) {
        const videoId = u.pathname.split("/embed/")[1];
        return `https://www.youtube.com/watch?v=${videoId}`;
      }

      // handle youtu.be short link
      if (u.hostname === "youtu.be") {
        const videoId = u.pathname.slice(1);
        return `https://www.youtube.com/watch?v=${videoId}`;
      }

      return url;
    } catch {
      return url;
    }
  }

  const handleSubmit = () => {
    if (!interview) return;

    if (!youtubeLink.trim()) {
      toast.error("Please enter YouTube link");
      return;
    }

    const normalized = normalizeYoutubeUrl(youtubeLink);
    onSubmit(interview.id, normalized);
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
        <h3 className="text-lg font-semibold">Publish Interview</h3>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-700">YouTube Link</label>

          <input
            type="url"
            placeholder="https://youtube.com/..."
            value={youtubeLink}
            onChange={(e) => setYoutubeLink(e.target.value)}
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
            className="px-4 py-1 bg-green-600 text-white cursor-pointer transition text-xs rounded-md hover:bg-green-700 hover:scale-[0.96]"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
