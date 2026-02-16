"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@iconify/react";
import { createStudio } from "@/lib/api/studio";
import {
  createStudioSchema,
  CreateStudioInput,
} from "@/lib/validations/studio.validation";
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

export default function AddStudioPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateStudioInput>({
    resolver: zodResolver(createStudioSchema),
    defaultValues: {
      address: "",
    },
  });

  const studioName = watch("studio_name");

  const fillSlugFromName = () => {
    if (studioName) setValue("slug", slugFromName(studioName));
  };

  const onSubmit = async (data: CreateStudioInput) => {
    setSubmitting(true);
    try {
      await createStudio({
        studio_name: data.studio_name,
        slug: data.slug,
        address: data.address ?? null,
      });
      toast.success("Studio created successfully");
      router.push("/dashboard/studio");
    } catch {
      toast.error("Failed to create studio");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/studio"
          className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Icon icon="mdi:arrow-left" className="text-xl" />
        </Link>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Add Studio
        </h2>
      </div>

      <Card>
        <CardHeader>Create New Studio</CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 max-w-lg"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Studio Name *
              </label>
              <input
                {...register("studio_name")}
                onBlur={fillSlugFromName}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. Main Recording Studio"
              />
              {errors.studio_name && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.studio_name.message}
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
                placeholder="e.g. main-recording-studio"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Blur Studio Name to auto-fill slug from name.
              </p>
              {errors.slug && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.slug.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Address
              </label>
              <textarea
                {...register("address")}
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                placeholder="Optional address"
              />
              {errors.address && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.address.message}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Link href="/dashboard/studio">
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? "Creating..." : "Create Studio"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
