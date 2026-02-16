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
    formState: { errors },
  } = useForm<UpdateGuestInput>({
    resolver: zodResolver(updateGuestSchema),
  });

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
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/guest"
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <Icon icon="mdi:arrow-left" className="text-xl" />
        </Link>
        <h2 className="text-xl font-semibold">Edit Guest</h2>
      </div>

      <Card>
        <CardHeader>Update Guest</CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 max-w-lg"
          >
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Full Name *
              </label>
              <input
                {...register("full_name")}
                className="w-full px-4 py-2 rounded-lg border"
              />
              {errors.full_name && (
                <p className="text-red-600 text-sm">
                  {errors.full_name.message}
                </p>
              )}
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium mb-2">Slug *</label>
              <input
                {...register("slug")}
                className="w-full px-4 py-2 rounded-lg border"
              />
            </div>

            {/* Designation */}
            <input
              {...register("designation")}
              placeholder="Designation"
              className="w-full px-4 py-2 rounded-lg border"
            />

            {/* Email */}
            <input
              {...register("email")}
              placeholder="Email"
              type="email"
              className="w-full px-4 py-2 rounded-lg border"
            />

            {/* Phone */}
            <input
              {...register("phone")}
              placeholder="Phone"
              className="w-full px-4 py-2 rounded-lg border"
            />

            {/* Bio */}
            <textarea
              {...register("bio")}
              placeholder="Bio"
              rows={3}
              className="w-full px-4 py-2 rounded-lg border"
            />

            {/* Referred By */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Referred By
              </label>
              <select
                {...register("referred_by")}
                className="w-full px-4 py-2 rounded-lg border"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Profile Image
              </label>

              {/* Current Image Preview */}
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

              {/* Change Button */}
              <Button
                type="button"
                variant="secondary"
                onClick={() => setMediaModalOpen(true)}
              >
                Change Image
              </Button>
            </div>

            {/* Social Media */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Social Media</label>

              <input
                {...register("social_media.linkedin")}
                placeholder="LinkedIn URL"
                className="w-full px-4 py-2 rounded-lg border"
              />

              <input
                {...register("social_media.facebook")}
                placeholder="Facebook URL"
                className="w-full px-4 py-2 rounded-lg border"
              />

              <input
                {...register("social_media.github")}
                placeholder="GitHub URL"
                className="w-full px-4 py-2 rounded-lg border"
              />

              <input
                {...register("social_media.instagram")}
                placeholder="Instagram URL"
                className="w-full px-4 py-2 rounded-lg border"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Link href="/dashboard/guest">
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Updating..." : "Update Guest"}
              </Button>
            </div>
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
