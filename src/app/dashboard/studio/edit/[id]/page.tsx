"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

import { Card, CardContent, CardHeader } from "@/components/ui/Card";

import { getStudioById, updateStudio } from "@/lib/api/studio";
import {
  updateStudioSchema,
  UpdateStudioInput,
} from "@/lib/validations/studio.validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormField } from "@/components/ui/FormField";
import { FormInput } from "@/components/ui/FormInput";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormActions } from "@/components/ui/FormActions";
import { slugify } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export default function EditStudioPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { loading: authLoading, hasPermission } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<UpdateStudioInput>({
    resolver: zodResolver(updateStudioSchema),
  });

  const studioName = watch("studio_name");

  useEffect(() => {
    if (authLoading) return;

    if (!hasPermission("studio.edit")) {
      router.replace("/dashboard/studio");
      return;
    }

    const fetchStudio = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const studio = await getStudioById(id);
        reset({
          studio_name: studio.studio_name,
          slug: studio.slug,
          address: studio.address ?? "",
        });
      } catch {
        toast.error("Failed to load studio");
        router.push("/dashboard/studio");
      } finally {
        setLoading(false);
      }
    };
    fetchStudio();
  }, [authLoading, hasPermission, id, reset, router]);

  const onSubmit = async (data: UpdateStudioInput) => {
    setSubmitting(true);
    try {
      await updateStudio(id, {
        ...(data.studio_name !== undefined && {
          studio_name: data.studio_name,
        }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.address !== undefined && {
          address: data.address === "" ? null : data.address,
        }),
      });
      toast.success("Studio updated successfully");
      router.push("/dashboard/studio");
    } catch {
      toast.error("Failed to update studio");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading || !hasPermission("studio.edit")) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Studio" backHref="/dashboard/studio" />

      <Card className="shadow-lg bg-white border-none py-5 px-5 md:px-0">
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormField label="Studio Name" required>
              <FormInput<UpdateStudioInput>
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
              <FormInput<UpdateStudioInput>
                name="slug"
                control={control}
                placeholder="e.g. main-recording-studio"
              />
              <p className="text-xs text-gray-500">
                Leave blank and blur Full Name to auto-fill.
              </p>
            </FormField>

            <FormField label="Address">
              <FormInput<UpdateStudioInput>
                name="address"
                control={control}
                placeholder="e.g. 123 Main St, City, Country"
              />
            </FormField>

            {/* Submit */}
            <FormActions
              cancelHref="/dashboard/studio"
              submitLabel="Update Studio"
              loadingLabel="Updating..."
              isSubmitting={submitting}
            />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
