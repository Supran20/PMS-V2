"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { createPlatformAdmin } from "@/lib/api/platformAdmin";
import {
  createPlatformAdminSchema,
  CreatePlatformAdminInput,
} from "@/lib/validations/platformAdmin.validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormField } from "@/components/ui/FormField";
import { FormInput } from "@/components/ui/FormInput";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormActions } from "@/components/ui/FormActions";

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

export default function AddPlatformAdminPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { control, handleSubmit, setValue } =
    useForm<CreatePlatformAdminInput>({
      resolver: zodResolver(createPlatformAdminSchema),
    });

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const onSubmit = async (data: CreatePlatformAdminInput) => {
    setSubmitting(true);
    try {
      // confirm_password is frontend-only, never sent to the backend.
      const { confirm_password, ...payload } = data;
      await createPlatformAdmin(payload);
      toast.success("Platform admin created successfully");
      router.push("/dashboard/platform-admin/admins");
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      const message =
        err?.response?.data?.message ?? "Failed to create platform admin";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Platform Admin"
        backHref="/dashboard/platform-admin/admins"
      />

      <Card className="shadow-lg bg-white border-none px-5 md:px-0 py-5">
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormField label="Full Name" required>
              <FormInput<CreatePlatformAdminInput>
                name="full_name"
                control={control}
                placeholder="e.g. John Doe"
              />
            </FormField>

            <FormField label="Email" required>
              <FormInput<CreatePlatformAdminInput>
                name="email"
                control={control}
                placeholder="e.g. john@example.com"
                type="email"
              />
            </FormField>

            <FormField label="Password" required>
              <FormInput<CreatePlatformAdminInput>
                name="password"
                control={control}
                placeholder="Enter a strong password"
                type="password"
              />
            </FormField>

            <FormField label="Re-enter Password" required>
              <FormInput<CreatePlatformAdminInput>
                name="confirm_password"
                control={control}
                placeholder="Re-enter password"
                type="password"
              />
            </FormField>

            <FormField label="Mobile Number">
              <FormInput<CreatePlatformAdminInput>
                name="mobile_number"
                control={control}
                placeholder="e.g. 98XXXXXXXX"
              />
            </FormField>

            {/* Profile Image (optional — not enforced by the backend schema) */}
            <FormField label="Profile Image">
              <div className="space-y-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    if (!allowedMimeTypes.includes(file.type)) {
                      toast.error(
                        "Invalid file type. Only jpeg, png, webp images are allowed.",
                      );
                      e.target.value = "";
                      setImagePreview(null);
                      return;
                    }

                    setValue("file", file, { shouldValidate: true });

                    const previewUrl = URL.createObjectURL(file);
                    setImagePreview(previewUrl);
                  }}
                  className="w-80 px-4 py-1 rounded-lg border text-xs border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700"
                />
                <p className="text-xs text-red-500">
                  Upload only jpg, png or webp image
                </p>

                {imagePreview && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Image Preview
                    </p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                )}
              </div>
            </FormField>

            <FormActions
              cancelHref="/dashboard/platform-admin/admins"
              submitLabel="Create Platform Admin"
              loadingLabel="Creating..."
              isSubmitting={submitting}
            />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
