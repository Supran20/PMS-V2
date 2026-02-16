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
    formState: { errors },
  } = useForm<CreateGuestInput>({
    resolver: zodResolver(createGuestSchema),
  });

  const fullName = watch("full_name");

  const fillSlugFromName = () => {
    if (fullName) setValue("slug", slugFromName(fullName));
  };

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
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/guest"
          className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Icon icon="mdi:arrow-left" className="text-xl" />
        </Link>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Add Guest
        </h2>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>Create New Guest</CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 max-w-lg"
          >
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name *
              </label>
              <input
                {...register("full_name")}
                onBlur={fillSlugFromName}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. John Doe"
              />
              {errors.full_name && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.full_name.message}
                </p>
              )}
            </div>
            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Slug *
              </label>
              <input
                {...register("slug")}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. john-doe"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Leave blank and blur Full Name to auto-fill.
              </p>
              {errors.slug && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.slug.message}
                </p>
              )}
            </div>
            {/* Designation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Designation
              </label>
              <input
                {...register("designation")}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. Manager"
              />
            </div>
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                {...register("email")}
                type="email"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. john@example.com"
              />
            </div>
            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone
              </label>
              <input
                {...register("phone")}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. +1234567890"
              />
            </div>
            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bio
              </label>
              <textarea
                {...register("bio")}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Short bio..."
                rows={3}
              />
            </div>
            {/* Referred By */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Referred By
              </label>
              <select
                {...register("referred_by")}
                className="w-full px-4 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700"
              >
                <option value="">Select User</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name}
                  </option>
                ))}
              </select>
            </div>
            {/* Profile Image */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Profile Image
              </label>

              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setMediaModalOpen(true)}
                >
                  Select Image
                </Button>

                {selectedMedia && (
                  <div className="flex items-center gap-2">
                    <img
                      src={`${API_BASE_URL}${selectedMedia.path}`}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <span className="text-sm">{selectedMedia.media_name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Social Media */}
            <div className="space-y-3">
              <label className="block text-sm font-medium">Social Media</label>

              <input
                {...register("social_media.linkedin")}
                placeholder="LinkedIn URL"
                className="w-full px-4 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700"
              />

              <input
                {...register("social_media.facebook")}
                placeholder="Facebook URL"
                className="w-full px-4 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700"
              />

              <input
                {...register("social_media.github")}
                placeholder="GitHub URL"
                className="w-full px-4 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700"
              />

              <input
                {...register("social_media.instagram")}
                placeholder="Instagram URL"
                className="w-full px-4 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700"
              />
            </div>

            {/* Submit / Cancel */}
            <div className="flex gap-3 pt-4">
              <Link href="/dashboard/guest">
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? "Creating..." : "Create Guest"}
              </Button>
            </div>
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
