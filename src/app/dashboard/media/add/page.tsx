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
import { FormField } from "@/components/ui/FormField";
import { FormInput } from "@/components/ui/FormInput";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormActions } from "@/components/ui/FormActions";

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
    control,
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
      <PageHeader title="Add Media" backHref="/dashboard/media" />

      <Card className="shadow-lg bg-white border-none py-5">
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormField label="Media Name" required>
              <FormInput<CreateMediaInput>
                name="media_name"
                control={control}
                placeholder="Enter media name"
              />
            </FormField>

            <FormField label="File" required>
              <input
                type="file"
                accept="image/*,.pdf,.mp3,.mp4"
                onChange={(e) =>
                  setValue("file", e.target.files?.[0] as File, {
                    shouldValidate: true,
                  })
                }
                className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700"
              />
              {file && (
                <p className="text-sm text-gray-500 mt-1">{file.name}</p>
              )}
              {errors.file && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.file.message}
                </p>
              )}
            </FormField>

            <FormField label="Tag">
              <select
                {...register("tag_id")}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            </FormField>
            <FormActions
              cancelHref="/dashboard/media"
              submitLabel="Create Media"
              loadingLabel="Creating..."
              isSubmitting={submitting}
            />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
