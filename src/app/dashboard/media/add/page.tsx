"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@iconify/react";
import { createMedia } from "@/lib/api/media";
import { getTags } from "@/lib/api/tags";
import {
  createMediaSchema,
  CreateMediaInput,
} from "@/lib/validations/media.validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function AddMediaPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [tags, setTags] = useState<{ id: string; tag_name: string }[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateMediaInput>({
    resolver: zodResolver(createMediaSchema),
  });

  const file = watch("file");

  useEffect(() => {
    getTags()
      .then(setTags)
      .catch(() => setTags([]));
  }, []);

  const onSubmit = async (data: CreateMediaInput) => {
    if (!data.file) {
      toast.error("Please select a file");
      return;
    }
    setSubmitting(true);
    try {
      await createMedia({
        media_name: data.media_name,
        tag_id: data.tag_id || null,
        file: data.file,
      });
      toast.success("Media created successfully");
      router.push("/dashboard/media");
    } catch {
      toast.error("Failed to create media");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/media"
          className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Icon icon="mdi:arrow-left" className="text-xl" />
        </Link>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Add Media
        </h2>
      </div>

      <Card>
        <CardHeader>Upload New Media</CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 max-w-lg"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Media Name *
              </label>
              <input
                {...register("media_name")}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="My Image"
              />
              {errors.media_name && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.media_name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                File *
              </label>
              <input
                type="file"
                accept="image/*,.pdf,.mp3,.mp4"
                onChange={(e) =>
                  setValue("file", e.target.files?.[0] as File, {
                    shouldValidate: true,
                  })
                }
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/30 dark:file:text-blue-300"
              />
              {file && (
                <p className="text-sm text-gray-500 mt-1">{file.name}</p>
              )}
              {errors.file && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.file.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tag
              </label>
              <select
                {...register("tag_id")}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">No tag</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.tag_name}
                  </option>
                ))}
              </select>
              {errors.tag_id && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.tag_id.message}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Link href="/dashboard/media">
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? "Uploading..." : "Upload Media"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
