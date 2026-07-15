"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { createUser } from "@/lib/api/user";
import {
  createUserSchema,
  CreateUserInput,
} from "@/lib/validations/user.validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormField } from "@/components/ui/FormField";
import { FormInput } from "@/components/ui/FormInput";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormActions } from "@/components/ui/FormActions";
import DatePicker from "react-datepicker";

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
  "video/mp4",
  "video/mpeg",
  "video/quicktime",
];

const RESTRICTED_ROLES = ["Host", "Staff"];

type VisibilityMode = "default" | "range" | "all";

function formatDate(date: Date | null): string | undefined {
  if (!date) return undefined;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function AddUserPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [visibilityMode, setVisibilityMode] =
    useState<VisibilityMode>("default");
  const [visibilityStart, setVisibilityStart] = useState<Date | null>(null);
  const [visibilityEnd, setVisibilityEnd] = useState<Date | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema) as any,
    defaultValues: {
      status: "active",
      role_name: "Staff",
      enable_otp_login: false,
      otp_in_mail: false,
      otp_in_sms: false,
      visibility_mode: "default",
    },
  });
  const enableOtp = watch("enable_otp_login");
  const roleName = watch("role_name");
  const isRestrictedRole = RESTRICTED_ROLES.includes(roleName);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  /**
   * If role switches away from Host/Staff (i.e. to Admin), visibility
   * settings don't apply anymore — reset to default and clear any dates
   * the admin may have already picked, and clear form-level values on
   * these fields since they're no longer relevant.
   */
  useEffect(() => {
    if (!isRestrictedRole) {
      setVisibilityMode("default");
      setVisibilityStart(null);
      setVisibilityEnd(null);
      setValue("visibility_mode", "default");
      setValue("visibility_start_date", undefined);
      setValue("visibility_end_date", undefined);
    }
  }, [isRestrictedRole, setValue]);

  const handleVisibilityModeChange = (mode: VisibilityMode) => {
    setVisibilityMode(mode);
    setValue("visibility_mode", mode);

    if (mode !== "range") {
      setVisibilityStart(null);
      setVisibilityEnd(null);
      setValue("visibility_start_date", undefined);
      setValue("visibility_end_date", undefined);
    }
  };

  const onSubmit = async (data: CreateUserInput) => {
    setSubmitting(true);
    try {
      const payload: any = { ...data };

      if (isRestrictedRole && visibilityMode === "range") {
        payload.visibility_mode = "range";
        payload.visibility_start_date = formatDate(visibilityStart);
        // End date is optional — a missing end means "start through now".
        // Only send it if the admin actually picked one.
        const end = formatDate(visibilityEnd);
        if (end) {
          payload.visibility_end_date = end;
        } else {
          delete payload.visibility_end_date;
        }
      } else if (isRestrictedRole && visibilityMode === "all") {
        payload.visibility_mode = "all";
        delete payload.visibility_start_date;
        delete payload.visibility_end_date;
      } else {
        // Default mode (or non-restricted role) — no window, mode "default"
        payload.visibility_mode = "default";
        delete payload.visibility_start_date;
        delete payload.visibility_end_date;
      }

      if (!isRestrictedRole) {
        delete payload.visibility_mode;
      }

      await createUser(payload);
      toast.success("User created successfully");
      router.push("/dashboard/users");
    } catch {
      toast.error("Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Add User" backHref="/dashboard/users" />

      <Card className="shadow-lg bg-white border-none px-5 md:px-0 py-5">
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormField label="Full Name" required>
              <FormInput<CreateUserInput>
                name="full_name"
                control={control as any}
                placeholder="e.g. John Doe"
              />
            </FormField>

            <FormField label="Email" required>
              <FormInput<CreateUserInput>
                name="email"
                control={control as any}
                placeholder="e.g. john@example.com"
                type="email"
              />
            </FormField>

            <FormField label="Password" required>
              <FormInput<CreateUserInput>
                name="password"
                control={control as any}
                placeholder="Enter a strong password"
                type="password"
              />
            </FormField>

            <FormField label="Re-enter Password" required>
              <FormInput<CreateUserInput>
                name="confirm_password"
                control={control as any}
                placeholder="Re-enter password"
                type="password"
              />
            </FormField>

            <FormField label="Status" required>
              <select
                {...register("status")}
                className="w-full px-4 py-2 rounded-lg border border-gray-300  bg-gray-50  text-gray-400  focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-4 py-2 rounded-lg border border-gray-300  bg-gray-50  text-gray-400  focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

            {/* Content Visibility — only relevant for Host/Staff */}
            {isRestrictedRole && (
              <FormField label="Content Visibility">
                <div className="md:w-3/4 space-y-3">
                  <div className="flex flex-col gap-2">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="radio"
                        className="mt-1"
                        checked={visibilityMode === "default"}
                        onChange={() => handleVisibilityModeChange("default")}
                      />
                      <span>
                        <span className="block text-sm font-medium text-gray-800">
                          Default (since account creation)
                        </span>
                        <span className="block text-xs text-gray-500">
                          This user will only see guests/interviews created
                          after their account is created (plus anything directly
                          assigned to them).
                        </span>
                      </span>
                    </label>

                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="radio"
                        className="mt-1"
                        checked={visibilityMode === "range"}
                        onChange={() => handleVisibilityModeChange("range")}
                      />
                      <span>
                        <span className="block text-sm font-medium text-gray-800">
                          Grant access to a historical date range
                        </span>
                        <span className="block text-xs text-gray-500">
                          In addition to their default access, this user will
                          also be able to see all content created between these
                          dates, regardless of assignment. Leave the end date
                          empty to grant access from the start date through
                          today.
                        </span>
                      </span>
                    </label>

                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="radio"
                        className="mt-1"
                        checked={visibilityMode === "all"}
                        onChange={() => handleVisibilityModeChange("all")}
                      />
                      <span>
                        <span className="block text-sm font-medium text-gray-800">
                          All records
                        </span>
                        <span className="block text-xs text-gray-500">
                          This user will be able to see every guest and
                          interview in the system, with no date restriction.
                        </span>
                      </span>
                    </label>
                  </div>

                  {visibilityMode === "range" && (
                    <div className="flex flex-col md:flex-row gap-3 pt-1">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Start Date
                        </label>
                        <DatePicker
                          selected={visibilityStart}
                          onChange={(date: Date | null) => {
                            setVisibilityStart(date);
                            setValue(
                              "visibility_start_date",
                              date ?? undefined,
                              { shouldValidate: true },
                            );
                          }}
                          selectsStart
                          startDate={visibilityStart}
                          endDate={visibilityEnd}
                          maxDate={new Date()}
                          className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
                          placeholderText="Select start date"
                          dateFormat="yyyy-MM-dd"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          End Date{" "}
                          <span className="text-gray-400">(optional)</span>
                        </label>
                        <DatePicker
                          selected={visibilityEnd}
                          onChange={(date: Date | null) => {
                            setVisibilityEnd(date);
                            setValue("visibility_end_date", date ?? undefined, {
                              shouldValidate: true,
                            });
                          }}
                          selectsEnd
                          startDate={visibilityStart}
                          endDate={visibilityEnd}
                          minDate={visibilityStart ?? undefined}
                          maxDate={new Date()}
                          isClearable
                          className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
                          placeholderText="Through today"
                          dateFormat="yyyy-MM-dd"
                        />
                      </div>
                    </div>
                  )}

                  {visibilityMode === "range" && !visibilityStart && (
                    <p className="text-xs text-amber-600">
                      A start date is required to grant access to a historical
                      range.
                    </p>
                  )}

                  {errors.visibility_start_date && (
                    <p className="text-sm text-red-600">
                      {errors.visibility_start_date.message as string}
                    </p>
                  )}
                  {errors.visibility_end_date && (
                    <p className="text-sm text-red-600">
                      {errors.visibility_end_date.message as string}
                    </p>
                  )}
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

                <br />
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

            {/* Submit */}
            <FormActions
              cancelHref="/dashboard/users"
              submitLabel="Create User"
              loadingLabel="Creating..."
              isSubmitting={submitting}
            />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
