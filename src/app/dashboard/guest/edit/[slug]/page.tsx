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
import { getUsers, User } from "@/lib/api/user";
import MediaSelectorModal from "@/components/media/MediaSelectorModal";
import { FormInput } from "@/components/ui/FormInput";
import { FormField } from "@/components/ui/FormField";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormActions } from "@/components/ui/FormActions";
import { slugify } from "@/lib/utils";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export default function EditGuestPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [guest, setGuest] = useState<Guest | null>(null);

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

  const fullName = watch("full_name");

  // Fetch guest
  useEffect(() => {
    const fetchGuest = async () => {
      try {
        const data = await getGuestBySlug(slug);
        setGuest(data);

        reset({
          full_name: data.full_name,
          designation: data.designation,
          slug: data.slug,
          bio: data.bio,
          email: data.email,
          phone: data.phone,
          referred_by: data.referred_by,
          profile_image: data.profile_image,
          social_media: data.social_media ?? {},
        });

        if (data.profileImage) {
          setSelectedMedia(data.profileImage);
          setValue("profile_image", data.profileImage.id);
        }
      } catch {
        toast.error("Failed to load guest");
      } finally {
        setLoading(false);
      }
    };

    fetchGuest();
  }, [slug, reset]);

  // Fetch users
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

  const onSubmit = async (data: UpdateGuestInput) => {
    setSubmitting(true);
    try {
      await updateGuestBySlug(slug, data);
      toast.success("Guest updated successfully");
      router.push("/dashboard/guest");
    } catch {
      toast.error("Failed to update guest");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="p-6">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader title="Edit Guest" backHref="/dashboard/guest" />

      <Card className="shadow-lg bg-white border-none py-5">
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Full Name */}
            <FormField label="Full Name" required>
              <FormInput<UpdateGuestInput>
                name="full_name"
                control={control}
                placeholder="e.g. John Doe"
                onBlur={() => {
                  const currentSlug = watch("slug");
                  if (!currentSlug && fullName) {
                    setValue("slug", slugify(fullName));
                  }
                }}
              />
            </FormField>

            {/* Slug */}
            <FormField label="Slug" required>
              <FormInput<UpdateGuestInput>
                name="slug"
                control={control}
                placeholder="e.g. john-doe"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Leave blank and blur Full Name to auto-fill.
              </p>
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
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              {/* Current Image Preview */}
              <div className="md:w-3/4 flex items-start gap-4">
                {selectedMedia?.path && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Image
                    </p>

                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${API_BASE_URL}${selectedMedia.path}`}
                      alt="Profile"
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
                  Change Image
                </Button>
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
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                />

                <FormInput<UpdateGuestInput>
                  name="social_media.github"
                  control={control}
                  placeholder="GitHub URL"
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                />

                <FormInput<UpdateGuestInput>
                  name="social_media.instagram"
                  control={control}
                  placeholder="Instagram URL"
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
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

      {/* Media Modal */}
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
