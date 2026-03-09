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
import { getUsers, getHostUser, User } from "@/lib/api/user";
import { FormField } from "@/components/ui/FormField";
import { FormInput } from "@/components/ui/FormInput";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormActions } from "@/components/ui/FormActions";
import { slugify } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { getTags } from "@/lib/api/tags";
import { z } from "zod";

export default function AddGuestPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [hostusers, setHostUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState<{ id: string; tag_name: string }[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { hasPermission, loading: authLoading } = useAuth();

  const { user } = useAuth();
  const isHostUser = user?.roles?.includes("Host");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createGuestSchema),
    defaultValues: {
      record: false,
    },
  });

  const fullName = watch("full_name");
  const recordValue = watch("record");

  useEffect(() => {
    if (authLoading) return;

    if (!hasPermission("guest.create")) {
      router.replace("/dashboard/guest");
      return;
    }

    const fetchData = async () => {
      try {
        const [allUsers, hosts] = await Promise.all([
          getUsers(), // for referred_by
          getHostUser(), // for host dropdown
        ]);

        setUsers(allUsers);
        setHostUsers(hosts);
      } catch {
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authLoading, hasPermission, router]);

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

  const onSubmit = async (data: CreateGuestInput) => {
    setSubmitting(true);
    try {
      if (isHostUser && user) {
        data.host_id = user.id;
      }
      await createGuest(data);
      toast.success("Guest created successfully");
      router.push("/dashboard/guest");
    } catch {
      toast.error("Failed to create guest");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <p className="p-6">
        {authLoading ? "Checking permissions..." : "Loading data..."}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader title="Add Guest" backHref="/dashboard/guest" />

      {/* Form */}
      <Card className="shadow-lg bg-white border-none py-5">
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
                    setValue("slug", slugify(fullName));
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
                  className="w-80 px-3 py-2 text-sm rounded-md border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500"
                >
                  <option
                    value=""
                    className="w-full px-3 py-2 text-sm  text-gray-100 rounded-md border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500"
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

                    setValue("file", file, { shouldValidate: true });

                    const previewUrl = URL.createObjectURL(file);
                    setImagePreview(previewUrl);
                  }}
                  className="w-80 px-4 py-1 rounded-lg border text-xs border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700"
                />

                {/* 🔥 Image Preview */}
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

                {/* Record Guest */}
                <FormField label="Record this guest?">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={recordValue || false}
                      onChange={(e) => setValue("record", e.target.checked)}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span className="text-sm text-gray-600">
                      Mark this guest as a record candidate
                    </span>
                  </div>
                </FormField>
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
    </div>
  );
}
