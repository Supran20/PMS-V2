"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

type Media = {
  id: string;
  media_name: string;
  path: string;
  type: string;
  tag?: {
    id: string;
    tag_name: string;
  };
};

interface Tag {
  id: string;
  tag_name: string;
}

interface MediaSelectorModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (media: Media) => void;
}

const ITEMS_PER_PAGE = 16;

const MediaSelectorModal: React.FC<MediaSelectorModalProps> = ({
  open,
  onClose,
  onSelect,
}) => {
  const [media, setMedia] = useState<Media[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!open) return;

    const fetchMedia = async () => {
      const res = await api.get("/media");
      setMedia(res.data.data || []);
    };

    const fetchTags = async () => {
      const res = await api.get("/tags");
      setTags(res.data.data || res.data);
    };

    fetchMedia();
    fetchTags();
  }, [open]);

  const filteredMedia = useMemo(() => {
    let data = media;

    if (search.trim()) {
      const term = search.toLowerCase();
      data = data.filter(
        (m) =>
          m.media_name.toLowerCase().includes(term) ||
          m.tag?.tag_name?.toLowerCase().includes(term),
      );
    }

    if (selectedTag) {
      data = data.filter((m) => m.tag?.id === selectedTag);
    }

    return data;
  }, [media, search, selectedTag]);

  const totalPages = Math.ceil(filteredMedia.length / ITEMS_PER_PAGE);

  const paginatedMedia = filteredMedia.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl w-full max-w-4xl p-6 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Select Media</h2>
          <button onClick={onClose}>
            <Icon icon="mdi:close" className="w-6 h-6" />
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-4">
          <input
            placeholder="Search media..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 border rounded"
          />

          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="px-3 py-2 border rounded"
          >
            <option value="">All Tags</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.tag_name}
              </option>
            ))}
          </select>
        </div>

        {/* Media Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto">
          {paginatedMedia.map((m) => (
            <div
              key={m.id}
              onClick={() => onSelect(m)}
              className="cursor-pointer border rounded p-2 hover:ring-2 hover:ring-blue-500"
            >
              <div className="h-28 bg-gray-100 flex items-center justify-center rounded">
                {m.type.startsWith("image") && (
                  <img
                    src={`${API_BASE_URL}${m.path}`}
                    className="w-full h-full object-cover rounded"
                    alt={m.media_name}
                  />
                )}

                {m.type.startsWith("video") && (
                  <video
                    src={`${API_BASE_URL}${m.path}`}
                    className="w-full h-full object-cover rounded"
                    muted
                    playsInline
                    preload="metadata"
                  />
                )}

                {!m.type.startsWith("image") && !m.type.startsWith("video") && (
                  <Icon
                    icon="heroicons:document"
                    className="w-10 h-10 text-gray-400"
                  />
                )}
              </div>

              <p className="text-xs mt-1 truncate">{m.media_name}</p>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default MediaSelectorModal;

