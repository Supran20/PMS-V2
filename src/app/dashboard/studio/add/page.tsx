"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { createStudio } from "@/lib/api/studio";
import {
  createStudioSchema,
  CreateStudioInput,
} from "@/lib/validations/studio.validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormField } from "@/components/ui/FormField";
import { FormInput } from "@/components/ui/FormInput";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormActions } from "@/components/ui/FormActions";
import { slugify } from "@/lib/utils";

export default function AddStudioPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<CreateStudioInput>({
    resolver: zodResolver(createStudioSchema),
    defaultValues: {
      address: "",
    },
  });

  const studioName = watch("studio_name");

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
      <PageHeader title="Add Studio" backHref="/dashboard/studio" />

      <Card className="shadow-lg bg-white border-none py-5">
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormField label="Studio Name" required>
              <FormInput<CreateStudioInput>
                name="studio_name"
                control={control}
                placeholder="e.g. Main Recording Studio"
                onBlur={() => {
                  const currentSlug = watch("slug");
                  if (!currentSlug && studioName) {
                    setValue("slug", slugify(studioName));
                  }
                }}
              />
            </FormField>

            <FormField label="Slug" required>
              <FormInput<CreateStudioInput>
                name="slug"
                control={control}
                placeholder="e.g. main-recording-studio"
              />
              <p className="text-xs text-gray-500">
                Leave blank and blur Full Name to auto-fill.
              </p>
            </FormField>

            <FormField label="Address">
              <FormInput<CreateStudioInput>
                name="address"
                control={control}
                placeholder="e.g. 123 Main St, City, Country"
              />
            </FormField>

            {/* Submit */}
            <FormActions
              cancelHref="/dashboard/studio"
              submitLabel="Create Studio"
              loadingLabel="Creating..."
              isSubmitting={submitting}
            />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

