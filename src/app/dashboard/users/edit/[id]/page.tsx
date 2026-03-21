"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { getUserById, updateUser } from "@/lib/api/user";
import {
  updateUserSchema,
  UpdateUserInput,
} from "@/lib/validations/user.validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormField } from "@/components/ui/FormField";
import { FormInput } from "@/components/ui/FormInput";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormActions } from "@/components/ui/FormActions";
import { getMediaUrl } from "@/lib/utils";

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
  "video/mp4",
  "video/mpeg",
  "video/quicktime",
];

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      enable_otp_login: false,
      otp_in_mail: false,
      otp_in_sms: false,
    },
  });

  const enableOtp = watch("enable_otp_login");

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const user = await getUserById(id);
        reset({
          full_name: user.full_name,
          email: user.email,
          status: (user.status as "active" | "inactive") ?? "active",
          role_name:
            (user.roles?.[0]?.role_name as "Admin" | "Host" | "Staff") ??
            "Staff",
          mobile_number: user.mobile_number ?? undefined,
          enable_otp_login: user.enable_otp_login ?? false,
          otp_in_mail: user.otp_in_mail ?? false,
          otp_in_sms: user.otp_in_sms ?? false,
        });
        if (user.profileImage?.path) {
          const imageUrl = getMediaUrl(user.profileImage.path);
          setImagePreview(imageUrl);
        }
      } catch {
        toast.error("Failed to load user");
        router.push("/dashboard/users");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id, reset, router]);

  const onSubmit = async (data: UpdateUserInput) => {
    setSubmitting(true);
    try {
      await updateUser(id, {
        full_name: data.full_name,
        email: data.email,
        status: data.status,
        role_name: data.role_name,
        mobile_number: data.mobile_number,
        enable_otp_login: data.enable_otp_login,
        otp_in_mail: data.otp_in_mail,
        otp_in_sms: data.otp_in_sms,

        file: data.file,
        ...(data.password &&
          data.password.length > 0 && { password: data.password }),
      });
      toast.success("User updated successfully");
      router.push("/dashboard/users");
    } catch {
      toast.error("Failed to update user");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit User" backHref="/dashboard/users" />

      <Card className="shadow-lg bg-white border-none px-5 md:px-0 py-5">
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormField label="Full Name" required>
              <FormInput<UpdateUserInput>
                name="full_name"
                control={control}
                placeholder="e.g. John Doe"
              />
            </FormField>

            <FormField label="Email" required>
              <FormInput<UpdateUserInput>
                name="email"
                control={control}
                placeholder="e.g. john@example.com"
                type="email"
              />
            </FormField>

            <FormField label="Status" required>
              <select
                {...register("status")}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              {errors.status && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.status.message}
                </p>
              )}
            </FormField>

            <FormField label="Role" required>
              <select
                {...register("role_name")}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Admin">Admin</option>
                <option value="Host">Host</option>
                <option value="Staff">Staff</option>
              </select>
              {errors.role_name && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.role_name.message}
                </p>
              )}
            </FormField>

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
              </div>
            </FormField>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("enable_otp_login")}
                id="enable_otp_login"
                className="rounded border-gray-300"
              />
              <label
                htmlFor="enable_otp_login"
                className="text-sm font-medium text-gray-700"
              >
                Enable OTP Login
              </label>
            </div>
            {errors.enable_otp_login && (
              <p className="text-red-600 text-sm">
                {errors.enable_otp_login.message}
              </p>
            )}

            {enableOtp && (
              <FormField label="OTP Method (Select One)" required>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={watch("otp_in_mail") === true}
                      onChange={() => {
                        setValue("otp_in_mail", true);
                        setValue("otp_in_sms", false);
                      }}
                    />
                    Email
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={watch("otp_in_sms") === true}
                      onChange={() => {
                        setValue("otp_in_mail", false);
                        setValue("otp_in_sms", true);
                      }}
                    />
                    SMS
                  </label>
                </div>

                {errors.otp_in_mail && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.otp_in_mail.message}
                  </p>
                )}
              </FormField>
            )}

            {/* Buttons */}
            <FormActions
              cancelHref="/dashboard/users"
              submitLabel="Update User"
              loadingLabel="Updating..."
              isSubmitting={submitting}
            />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
