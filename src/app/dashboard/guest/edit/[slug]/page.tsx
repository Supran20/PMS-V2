"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@iconify/react";
import { getGuestBySlug, updateGuestBySlug, Guest } from "@/lib/api/guest";
import {
  updateGuestSchema,
  UpdateGuestInput,
} from "@/lib/validations/guest.validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { getUsers, getHostUser, User } from "@/lib/api/user";
import { FormInput } from "@/components/ui/FormInput";
import { FormField } from "@/components/ui/FormField";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormActions } from "@/components/ui/FormActions";
import { getMediaUrl } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { getTags } from "@/lib/api/tags";

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
  "video/mp4",
  "video/mpeg",
  "video/quicktime",
];

export default function EditGuestPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  const [guest, setGuest] = useState<Guest | null>(null);
  const [tags, setTags] = useState<{ id: string; tag_name: string }[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [hostusers, setHostUsers] = useState<User[]>([]);

  const { hasPermission, loading: authLoading } = useAuth();
  const { user } = useAuth();
  const isHostUser = user?.roles?.includes("Host");

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<UpdateGuestInput>({
    resolver: zodResolver(updateGuestSchema),
  });

  // Redirect if user doesn't have permission
  useEffect(() => {
    if (authLoading) return;

    if (!hasPermission("guest.update")) {
      router.replace("/dashboard/guest");
      return;
    }

    // Only fetch data if permission is ok
    const fetchGuest = async () => {
      setLoading(true);
      try {
        const data = await getGuestBySlug(slug);
        setGuest(data);

        reset({
          full_name: data.full_name,
          designation: data.designation,
          bio: data.bio,
          email: data.email,
          phone: data.phone,
          referred_by: data.referred_by,
          host_id: data.host_id ?? "",
          record: data.record ?? false,

          social_media: data.social_media ?? {},
          tag_id: data.profileImage?.tag_id ?? "",
        });

        if (data.profileImage?.path) {
          const imageUrl = getMediaUrl(data.profileImage.path);
          setImagePreview(imageUrl);
        }
      } catch {
        toast.error("Failed to load guest");
      } finally {
        setLoading(false);
      }
    };

    fetchGuest();

    const fetchUsers = async () => {
      try {
        const [allUsers, hosts] = await Promise.all([
          getUsers(),
          getHostUser(),
        ]);

        setUsers(allUsers);
        setHostUsers(hosts);
      } catch {
        toast.error("Failed to load users");
      }
    };
    fetchUsers();
  }, [authLoading, hasPermission, router, slug, reset, setValue]);

  useEffect(() => {
    getTags()
      .then(setTags)
      .catch(() => setTags([]));
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const onSubmit = async (data: UpdateGuestInput) => {
    setSubmitting(true);
    try {
      if (isHostUser && user) {
        data.host_id = user.id;
      }

      await updateGuestBySlug(slug, data);
      toast.success("Guest updated successfully");
      router.push("/dashboard/guest");
    } catch {
      toast.error("Failed to update guest");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <p className="p-6">
        {authLoading ? "Checking permissions..." : "Loading guest..."}
      </p>
    );
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader title="Edit Guest" backHref="/dashboard/guest" />

      <Card className="shadow-lg bg-white border-none py-5 px-5 sm:px-0">
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Full Name */}
            <FormField label="Full Name" required>
              <FormInput<UpdateGuestInput>
                name="full_name"
                control={control}
                placeholder="e.g. John Doe"
              />
            </FormField>

            {/* Designation */}
            <FormField label="Designation">
              <FormInput<UpdateGuestInput>
                name="designation"
                control={control}
                placeholder="e.g. Manager"
              />
            </FormField>

            {/* Email */}
            <FormField label="Email">
              <FormInput<UpdateGuestInput>
                name="email"
                control={control}
                type="email"
                placeholder="e.g. john@example.com"
              />
            </FormField>

            {/* Phone */}
            <FormField label="Phone">
              <FormInput<UpdateGuestInput>
                name="phone"
                control={control}
                placeholder="e.g. +1234567890"
              />
            </FormField>

            {/* Bio */}
            <FormField label="Bio">
              <FormInput<UpdateGuestInput>
                name="bio"
                control={control}
                as="textarea"
                rows={3}
                placeholder="Short bio..."
              />
            </FormField>

            {/* Referred By */}
            <FormField label="Referred By">
              <div className="md:w-3/4">
                <select
                  {...register("referred_by")}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select User</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </FormField>

            {!isHostUser && (
              <FormField label="Choose Host" required>
                <div className="md:w-3/4">
                  <select
                    {...register("host_id")}
                    className="w-80 px-3 py-2 text-sm rounded-md border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Host</option>
                    {hostusers.map((host) => (
                      <option key={host.id} value={host.id}>
                        {host.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </FormField>
            )}

            {/* Profile Image */}
            <FormField label="Profile Image" required>
              <div className="space-y-4">
                {/* File Upload */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    // 🔥 Validate file type
                    if (!allowedMimeTypes.includes(file.type)) {
                      toast.error(
                        "Invalid file type. Only jpeg, png, webp images are allowed.",
                      );
                      e.target.value = ""; // Clear the invalid file
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

                {/* 🔥 Image Preview */}
                {imagePreview && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {imagePreview.startsWith("blob:")
                        ? "New Image Preview"
                        : "Current Image"}
                    </p>

                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Profile Preview"
                      className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                )}

                <br />
                {/* Tag Select */}
                <select
                  {...register("tag_id")}
                  className="w-80 px-4 py-2 rounded-lg border border-gray-300 bg-gray-50"
                >
                  <option value="">No tag</option>
                  {tags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.tag_name}
                    </option>
                  ))}
                </select>
              </div>
            </FormField>

            {/* Social Media */}
            <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4">
              <label className="md:w-1/4 text-sm font-semibold text-gray-700 pt-2">
                Social Media
              </label>
              <div className="md:w-3/4 space-y-2">
                <FormInput<UpdateGuestInput>
                  name="social_media.linkedin"
                  control={control}
                  placeholder="LinkedIn URL"
                />

                <FormInput<UpdateGuestInput>
                  name="social_media.facebook"
                  control={control}
                  placeholder="Facebook URL"
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500"
                />

                <FormInput<UpdateGuestInput>
                  name="social_media.github"
                  control={control}
                  placeholder="GitHub URL"
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500"
                />

                <FormInput<UpdateGuestInput>
                  name="social_media.instagram"
                  control={control}
                  placeholder="Instagram URL"
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Buttons */}
            <FormActions
              cancelHref="/dashboard/guest"
              submitLabel="Update Guest"
              loadingLabel="Updating..."
              isSubmitting={submitting}
            />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
