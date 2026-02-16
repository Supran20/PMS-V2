"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@iconify/react";
import { getTagById, updateTag } from "@/lib/api/tags";
import {
  updateTagSchema,
  UpdateTagInput,
} from "@/lib/validations/tag.validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

function slugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export default function EditTagPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateTagInput>({
    resolver: zodResolver(updateTagSchema),
  });

  const tagName = watch("tag_name");

  const fillSlugFromName = () => {
    if (tagName) setValue("slug", slugFromName(tagName));
  };

  useEffect(() => {
    const fetchTag = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const tag = await getTagById(id);
        reset({
          tag_name: tag.tag_name,
          slug: tag.slug,
        });
      } catch {
        toast.error("Failed to load tag");
        router.push("/dashboard/tags");
      } finally {
        setLoading(false);
      }
    };
    fetchTag();
  }, [id, reset, router]);

  const onSubmit = async (data: UpdateTagInput) => {
    setSubmitting(true);
    try {
      await updateTag(id, {
        ...(data.tag_name !== undefined && { tag_name: data.tag_name }),
        ...(data.slug !== undefined && { slug: data.slug }),
      });
      toast.success("Tag updated successfully");
      router.push("/dashboard/tags");
    } catch {
      toast.error("Failed to update tag");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/tags"
          className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Icon icon="mdi:arrow-left" className="text-xl" />
        </Link>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Edit Tag
        </h2>
      </div>

      <Card>
        <CardHeader>Update Tag</CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 max-w-lg"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tag Name *
              </label>
              <input
                {...register("tag_name")}
                onBlur={fillSlugFromName}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. Technology"
              />
              {errors.tag_name && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.tag_name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Slug *
              </label>
              <input
                {...register("slug")}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. technology"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Blur Tag Name to auto-fill slug from name.
              </p>
              {errors.slug && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.slug.message}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Link href="/dashboard/tags">
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
