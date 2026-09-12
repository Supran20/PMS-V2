"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@iconify/react";
import { MultiValue } from "react-select";
import CreatableSelect from "react-select/creatable";
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
import { useAuth } from "@/context/AuthContext";
import { getTags, createTag, Tag } from "@/lib/api/tags";
import Select from "react-select";
import GuestReapprovalModal from "@/components/guest/GuestReapprovalModal";
import { parseReapprovalError, type ReapprovalErrorInfo } from "@/lib/utils";

import { z } from "zod";

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
  "video/mp4",
  "video/mpeg",
  "video/quicktime",
];

type Option = {
  value: string;
  label: string;
};

export default function AddGuestPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [hostusers, setHostUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Option[]>([]);

  // Set when createGuest 409s with a duplicate-guest code — drives the
  // GuestReapprovalModal instead of a plain error toast.
  const [reapprovalInfo, setReapprovalInfo] =
    useState<ReapprovalErrorInfo | null>(null);
  const [reapprovalGuestName, setReapprovalGuestName] = useState("");

  const { hasPermission, loading: authLoading, user } = useAuth();

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

  useEffect(() => {
    if (authLoading) return;

    if (!hasPermission("guests.create")) {
      router.replace("/dashboard/guest");
      return;
    }

    const fetchData = async () => {
      try {
        const [allUsers, hosts, allTags] = await Promise.all([
          getUsers(), // for referred_by
          getHostUser(), // for host dropdown
          getTags(), // for tags dropdown
        ]);
        const activeUsers = allUsers.filter((u) => u.status === "active");
        setUsers(activeUsers);
        setHostUsers(hosts);
        setTags(allTags);
      } catch {
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authLoading, router]);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const tagOptions: Option[] = tags.map((tag) => ({
    value: tag.id,
    label: tag.tag_name,
  }));

  const onSubmit = async (data: CreateGuestInput) => {
    setSubmitting(true);
    try {
      if (isHostUser && user) {
        data.host_id = user.id;
      }
      await createGuest(data);
      toast.success("Guest created successfully");
      router.push("/dashboard/guest");
    } catch (err: any) {
      const info = parseReapprovalError(err);

      if (info) {
        // Same guest already exists (matched by email/phone). Surface
        // the reapproval modal instead of a plain error toast — the
        // user typed `data.full_name`, which may differ slightly from
        // the existing record's name, but it's the closest label we
        // have without a follow-up fetch.
        setReapprovalGuestName(data.full_name);
        setReapprovalInfo(info);
      } else {
        toast.error("Failed to create guest");
      }
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

  if (!hasPermission("guests.create")) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );  
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader title="Add Guest" backHref="/dashboard/guest" />

      {/* Form */}
      <Card className="shadow-lg bg-white border-none px-5 sm:px-0 py-5">
        {/* <CardHeader>Create New Guest</CardHeader> */}
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Full Name */}
            <FormField label="Full Name" required>
              <FormInput
                name="full_name"
                control={control}
                placeholder="e.g. John Doe"
              />
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

            <FormField label="Tags">
              <div className="md:w-3/4">
                <CreatableSelect
                  isMulti
                  options={tagOptions}
                  value={selectedTags}
                  onChange={(selected: MultiValue<Option>) => {
                    const selectedArray = [...selected];

                    setSelectedTags(selectedArray);

                    const ids = selectedArray.map((t) => t.value);
                    setValue("tag_ids", ids);
                  }}
                  onCreateOption={async (inputValue) => {
                    try {
                      const newTag = await createTag({
                        tag_name: inputValue, // ✅ correct
                        slug: "", // let backend generate
                      });

                      const newOption = {
                        value: newTag.id,
                        label: newTag.tag_name,
                      };

                      setTags((prev) => [...prev, newTag]);

                      const updatedSelected = [...selectedTags, newOption];
                      setSelectedTags(updatedSelected);

                      const ids = updatedSelected.map((t) => t.value);
                      setValue("tag_ids", ids);

                      toast.success("Tag created");
                    } catch {
                      toast.error("Failed to create tag");
                    }
                  }}
                  className="text-sm"
                />
              </div>
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

      {reapprovalInfo && (
        <GuestReapprovalModal
          open={!!reapprovalInfo}
          onClose={() => setReapprovalInfo(null)}
          triggerSource={reapprovalInfo.triggerSource}
          guestId={reapprovalInfo.guestId}
          guestName={reapprovalGuestName}
          proposedHostId={
            isHostUser ? (user?.id ?? null) : (watch("host_id") ?? null)
          }
          reapprovalRequestId={reapprovalInfo.reapprovalRequestId}
          onRequested={() => {
            setReapprovalInfo(null);
            router.push("/dashboard/guest");
          }}
        />
      )}
    </div>
  );
}
