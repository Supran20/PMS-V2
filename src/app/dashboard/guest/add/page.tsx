"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@iconify/react";
import { createGuest } from "@/lib/api/guest";
import {
  createGuestSchema,
  CreateGuestInput,
} from "@/lib/validations/guest.validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { getUsers, User } from "@/lib/api/user";
import MediaSelectorModal from "@/components/media/MediaSelectorModal";
import { FormField } from "@/components/ui/FormField";
import { FormInput } from "@/components/ui/FormInput";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormActions } from "@/components/ui/FormActions";

function slugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export default function AddGuestPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<CreateGuestInput>({
    resolver: zodResolver(createGuestSchema),
  });

  const fullName = watch("full_name");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUsers();
        setUsers(data);
      } catch {
        toast.error("Failed to load users");
      }
    };

    fetchUsers();
  }, []);

  const onSubmit = async (data: CreateGuestInput) => {
    setSubmitting(true);
    try {
      await createGuest(data);
      toast.success("Guest created successfully");
      router.push("/dashboard/guest");
    } catch {
      toast.error("Failed to create guest");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader title="Add Guest" backHref="/dashboard/guest" />

      {/* Form */}
      <Card className="py-5">
        {/* <CardHeader>Create New Guest</CardHeader> */}
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Full Name */}
            <FormField label="Full Name" required>
              <FormInput
                name="full_name"
                control={control}
                placeholder="e.g. John Doe"
                onBlur={() => {
                  const currentSlug = watch("slug");
                  if (!currentSlug && fullName) {
                    setValue("slug", slugFromName(fullName));
                  }
                }}
              />
            </FormField>

            {/* Slug */}
            <FormField label="Slug" required>
              <FormInput
                name="slug"
                control={control}
                placeholder="e.g. john-doe"
              />
              <p className="text-xs text-gray-500">
                Leave blank and blur Full Name to auto-fill.
              </p>
            </FormField>

            {/* Designation */}
            <FormField label="Designation">
              <FormInput
                name="designation"
                control={control}
                placeholder="e.g. CEO of Acme Corp"
              />
            </FormField>

            {/* Email */}
            <FormField label="Email">
              <FormInput
                name="email"
                control={control}
                placeholder="e.g. john@example.com"
              />
            </FormField>

            {/* Phone */}
            <FormField label="Phone">
              <FormInput
                name="phone"
                control={control}
                placeholder="e.g. +1234567890"
              />
            </FormField>

            {/* Bio */}
            <FormField label="Bio">
              <FormInput
                name="bio"
                control={control}
                placeholder="Short bio about the guest"
                as="textarea"
                rows={4}
              />
            </FormField>

            {/* Referred By */}
            <FormField label="Referred By">
              <div className="md:w-3/4">
                <select
                  {...register("referred_by")}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                >
                  <option
                    value=""
                    className="w-full px-3 py-2 text-sm  text-gray-100 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                  >
                    Select User
                  </option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </FormField>

            {/* Profile Image */}
            <FormField label="Profile Image">
              <div className="md:w-3/4 flex items-start gap-4">
                {selectedMedia && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Image
                    </p>
                    <img
                      src={`${API_BASE_URL}${selectedMedia.path}`}
                      className="w-32 h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                  </div>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  className="border border-gray-300 dark:border-gray-600 rounded-md"
                  onClick={() => setMediaModalOpen(true)}
                >
                  Select Image
                </Button>
              </div>
            </FormField>

            {/* Social Media */}
            <FormField label="Social Media Profiles">
              <div className="md:w-3/4 space-y-2">
                <FormInput
                  name="social_media.linkedin"
                  control={control}
                  placeholder="LinkedIn URL"
                />
                <FormInput
                  name="social_media.facebook"
                  control={control}
                  placeholder="Facebook URL"
                />
                <FormInput
                  name="social_media.github"
                  control={control}
                  placeholder="GitHub URL"
                />
                <FormInput
                  name="social_media.instagram"
                  control={control}
                  placeholder="Instagram URL"
                />
              </div>
            </FormField>

            {/* Submit */}
            <FormActions
              cancelHref="/dashboard/guest"
              submitLabel="Create Guest"
              loadingLabel="Creating..."
              isSubmitting={submitting}
            />
          </form>
        </CardContent>
      </Card>

      <MediaSelectorModal
        open={mediaModalOpen}
        onClose={() => setMediaModalOpen(false)}
        onSelect={(media) => {
          setSelectedMedia(media);
          setValue("profile_image", media.id);
          setMediaModalOpen(false);
        }}
      />
    </div>
  );
}
