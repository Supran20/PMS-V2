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
import { FormField } from "@/components/ui/FormField";
import { FormInput } from "@/components/ui/FormInput";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormActions } from "@/components/ui/FormActions";
import { slugify } from "@/lib/utils";

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
    control,
    formState: { errors },
  } = useForm<UpdateTagInput>({
    resolver: zodResolver(updateTagSchema),
  });

  const tagName = watch("tag_name");

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
      <PageHeader title="Edit Tag" backHref="/dashboard/tags" />

      <Card className="shadow-lg bg-white border-none py-5">
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormField label="Tag Name" required>
              <FormInput<UpdateTagInput>
                name="tag_name"
                control={control}
                placeholder="e.g. Technology"
                onBlur={() => {
                  const currentSlug = watch("slug");
                  if (!currentSlug && tagName) {
                    setValue("slug", slugify(tagName));
                  }
                }}
              />
            </FormField>

            <FormField label="Slug" required>
              <FormInput<UpdateTagInput>
                name="slug"
                control={control}
                placeholder="e.g. technology"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Leave blank and blur Tag Name to auto-fill from name.
              </p>
            </FormField>

            {/* Submit */}
            <FormActions
              cancelHref="/dashboard/tags"
              submitLabel="Update Tag"
              loadingLabel="Updating..."
              isSubmitting={submitting}
            />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
