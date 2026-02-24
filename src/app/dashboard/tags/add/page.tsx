"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@iconify/react";
import { createTag } from "@/lib/api/tags";
import {
  createTagSchema,
  CreateTagInput,
} from "@/lib/validations/tag.validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormField } from "@/components/ui/FormField";
import { FormInput } from "@/components/ui/FormInput";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormActions } from "@/components/ui/FormActions";
import { slugify } from "@/lib/utils";

export default function AddTagPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<CreateTagInput>({
    resolver: zodResolver(createTagSchema),
  });

  const tagName = watch("tag_name");

  const onSubmit = async (data: CreateTagInput) => {
    setSubmitting(true);
    try {
      await createTag({
        tag_name: data.tag_name,
        slug: data.slug,
      });
      toast.success("Tag created successfully");
      router.push("/dashboard/tags");
    } catch {
      toast.error("Failed to create tag");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Add Tag" backHref="/dashboard/tags" />

      <Card className="shadow-lg bg-white border-none py-5">
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormField label="Tag Name" required>
              <FormInput<CreateTagInput>
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
              <FormInput<CreateTagInput>
                name="slug"
                control={control}
                placeholder="e.g. technology"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave blank and blur Tag Name to auto-fill from name.
              </p>
            </FormField>

            {/* Submit */}
            <FormActions
              cancelHref="/dashboard/tags"
              submitLabel="Create Tag"
              loadingLabel="Creating..."
              isSubmitting={submitting}
            />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

