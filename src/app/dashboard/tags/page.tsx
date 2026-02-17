"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DeleteModal } from "@/components/ui/DeleteModal";
import { Icon } from "@iconify/react";
import { getTags, deleteTag, Tag } from "@/lib/api/tags";
import { toast } from "sonner";
import { AddButton } from "@/components/ui/AddButton";

export default function TagsPage() {
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const data = await getTags();
      setTags(data ?? []);
    } catch {
      toast.error("Failed to load tags");
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const filteredTags = useMemo(() => {
    if (!search.trim()) return tags;
    const q = search.toLowerCase();
    return tags.filter(
      (t) =>
        t.tag_name.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q),
    );
  }, [tags, search]);

  const handleEditClick = (tag: Tag) => {
    router.push(`/dashboard/tags/edit/${tag.id}`);
  };

  const handleDeleteClick = (tag: Tag) => {
    setTagToDelete(tag);
    setDeleteModalOpen(true);
  };

  const handleDeleteClose = () => {
    setDeleteModalOpen(false);
    setTagToDelete(null);
  };

  const handleDeleteConfirm = async (tag: Tag) => {
    await deleteTag(tag.id);
    fetchTags();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Tags
        </h2>
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Tags
        </h2>
        <AddButton href="/dashboard/tags/add" label="Add Tag" />
      </div>

      <Card className="shadow-lg bg-white border-none py-5">
        <CardContent>
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Icon
                icon="mdi:magnify"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by tag name or slug..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {filteredTags.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 py-8 text-center">
              {search.trim() ? "No tags match your search" : "No tags found"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Tag Name
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Slug
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTags.map((tag) => (
                    <tr
                      key={tag.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                        {tag.tag_name}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {tag.slug}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(tag)}
                            className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            title="Edit"
                          >
                            <Icon icon="mdi:pencil" className="text-xl" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(tag)}
                            className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Delete"
                          >
                            <Icon icon="mdi:delete" className="text-xl" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteModal<Tag>
        open={deleteModalOpen}
        item={tagToDelete}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteConfirm}
        titleKey="tag_name"
      />
    </div>
  );
}
