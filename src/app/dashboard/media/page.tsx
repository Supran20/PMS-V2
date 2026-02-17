"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DeleteModal } from "@/components/ui/DeleteModal";
import { Icon } from "@iconify/react";
import { getMedia, deleteMedia, Media } from "@/lib/api/media";
import { getTags } from "@/lib/api/tags";
import { getMediaUrl } from "@/lib/utils";
import { toast } from "sonner";
import { AddButton } from "@/components/ui/AddButton";

export default function MediaPage() {
  const router = useRouter();
  const [media, setMedia] = useState<Media[]>([]);
  const [tags, setTags] = useState<{ id: string; tag_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTagId, setFilterTagId] = useState<string>("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<Media | null>(null);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const [mediaData, tagsData] = await Promise.all([getMedia(), getTags()]);
      setMedia(mediaData ?? []);
      setTags(tagsData ?? []);
    } catch {
      toast.error("Failed to load media");
      setMedia([]);
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const filteredMedia = useMemo(() => {
    return media.filter((m) => {
      const matchesSearch =
        !search || m.media_name.toLowerCase().includes(search.toLowerCase());
      const matchesTag = !filterTagId || m.tag_id === filterTagId;
      return matchesSearch && matchesTag;
    });
  }, [media, search, filterTagId]);

  const handleEditClick = (item: Media) => {
    router.push(`/dashboard/media/edit/${item.id}`);
  };

  const handleDeleteClick = (item: Media) => {
    setMediaToDelete(item);
    setDeleteModalOpen(true);
  };

  const handleDeleteClose = () => {
    setDeleteModalOpen(false);
    setMediaToDelete(null);
  };

  const handleDeleteConfirm = async (item: Media) => {
    await deleteMedia(item.id);
    fetchMedia();
  };

  const isImage = (type: string) => type?.startsWith("image/") ?? false;

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Media
        </h2>
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Media
        </h2>
        <AddButton href="/dashboard/media/add" label="Add Media" />
      </div>

      <Card className="shadow-lg bg-white border-none py-5">
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Icon
                icon="mdi:magnify"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xl"
              />
              <input
                type="text"
                placeholder="Search by media name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterTagId}
              onChange={(e) => setFilterTagId(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[180px]"
            >
              <option value="">All tags</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.tag_name}
                </option>
              ))}
            </select>
          </div>

          {filteredMedia.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 py-12 text-center">
              No media found
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredMedia.map((item) => (
                <div
                  key={item.id}
                  className="group relative rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800 hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-square relative">
                    {isImage(item.type) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getMediaUrl(item.path)}
                        alt={item.media_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                        <Icon
                          icon="mdi:file"
                          className="text-4xl text-gray-500"
                        />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEditClick(item)}
                        className="p-2 rounded-lg bg-white/90 text-blue-600 hover:bg-white transition-colors"
                        title="Edit"
                      >
                        <Icon icon="mdi:pencil" className="text-xl" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(item)}
                        className="p-2 rounded-lg bg-white/90 text-red-600 hover:bg-white transition-colors"
                        title="Delete"
                      >
                        <Icon icon="mdi:delete" className="text-xl" />
                      </button>
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {item.media_name}
                    </p>
                    {item.tag && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {item.tag.tag_name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteModal<Media>
        open={deleteModalOpen}
        item={mediaToDelete}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteConfirm}
        titleKey="media_name"
      />
    </div>
  );
}
