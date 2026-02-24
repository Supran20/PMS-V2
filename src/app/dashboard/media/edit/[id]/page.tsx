"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@iconify/react";
import { getMediaById, updateMedia } from "@/lib/api/media";
import { getTags } from "@/lib/api/tags";
import { getMediaUrl } from "@/lib/utils";
import {
  updateMediaSchema,
  UpdateMediaInput,
} from "@/lib/validations/media.validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormInput } from "@/components/ui/FormInput";
import { FormField } from "@/components/ui/FormField";
import { FormActions } from "@/components/ui/FormActions";

export default function EditMediaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tags, setTags] = useState<{ id: string; tag_name: string }[]>([]);
  const [currentPath, setCurrentPath] = useState<string>("");
  const [currentType, setCurrentType] = useState<string>("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<UpdateMediaInput>({
    resolver: zodResolver(updateMediaSchema),
  });

  const file = watch("file");

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [media, tagsData] = await Promise.all([
          getMediaById(id),
          getTags(),
        ]);
        setTags(tagsData ?? []);
        setCurrentPath(media.path);
        setCurrentType(media.type);
        reset({
          media_name: media.media_name,
          tag_id: media.tag_id ?? "",
        });
      } catch {
        toast.error("Failed to load media");
        router.push("/dashboard/media");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, reset, router]);

  const onSubmit = async (data: UpdateMediaInput) => {
    setSubmitting(true);
    try {
      await updateMedia(id, {
        media_name: data.media_name,
        tag_id: data.tag_id === "" ? null : data.tag_id,
        ...(data.file && { file: data.file }),
      });
      toast.success("Media updated successfully");
      router.push("/dashboard/media");
    } catch {
      toast.error("Failed to update media");
    } finally {
      setSubmitting(false);
    }
  };

  const isImage = (type: string) => type?.startsWith("image") ?? false;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Media" backHref="/dashboard/media" />

      <Card className="shadow-lg bg-white border-none py-5">
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {currentPath && isImage(currentType) && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Current Image
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getMediaUrl(currentPath)}
                  alt="Current"
                  className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                />
              </div>
            )}

            <FormField label="Media Name" required>
              <FormInput<UpdateMediaInput>
                name="media_name"
                control={control}
                placeholder="Enter media name"
              />
            </FormField>

            <FormField label="Replace File (optional)">
              <input
                type="file"
                accept="image/*,.pdf,.mp3,.mp4"
                onChange={(e) =>
                  setValue("file", e.target.files?.[0] as File, {
                    shouldValidate: false,
                  })
                }
                className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700"
              />
              {file && (
                <p className="text-sm text-gray-500 mt-1">
                  New file: {file.name}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to keep current file
              </p>
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
              submitLabel="Update Media"
              loadingLabel="Updating..."
              isSubmitting={submitting}
            />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
