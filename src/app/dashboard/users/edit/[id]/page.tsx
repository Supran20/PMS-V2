"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { getUserById, updateUser } from "@/lib/api/user";
import {
  editUserFormSchema,
  EditUserFormInput,
} from "@/lib/validations/user.validation";
import { parseDateOnly, toDateOnlyString, isValidDate } from "@/lib/date-utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormField } from "@/components/ui/FormField";
import { FormInput } from "@/components/ui/FormInput";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormActions } from "@/components/ui/FormActions";
import { getMediaUrl } from "@/lib/utils";
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

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [userCreatedAt, setUserCreatedAt] = useState<Date | null>(null);
  const [visibilityMode, setVisibilityMode] =
    useState<VisibilityMode>("default");
  const [visibilityStart, setVisibilityStart] = useState<Date | null>(null);
  const [visibilityEnd, setVisibilityEnd] = useState<Date | null>(null);

  // Tracks whether the fetched user originally had a role-init pass done,
  // so the role-change effect doesn't wipe out settings we just loaded
  // from the server on the very first render.
  const [hasInitialized, setHasInitialized] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EditUserFormInput>({
    resolver: zodResolver(editUserFormSchema) as any,
    defaultValues: {
      enable_otp_login: false,
      otp_in_mail: false,
      otp_in_sms: false,
      hide_guest_contacts: false,
      status: "active",
      role_name: "Staff",
    },
  });

  const enableOtp = watch("enable_otp_login");
  const roleName = watch("role_name");
  const isRestrictedRole = RESTRICTED_ROLES.includes(roleName ?? "");

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
          hide_guest_contacts: user.hide_guest_contacts ?? false,
        });

        setUserCreatedAt(user.created_at ? new Date(user.created_at) : null);

        // Pre-select mode straight from the server's visibility_mode —
        // no more inferring "range" from date presence, since "all" mode
        // has no dates to infer from.
        const serverMode: VisibilityMode =
          (user.visibility_mode as VisibilityMode) ?? "default";

        setVisibilityMode(serverMode);

        if (serverMode === "range") {
          setVisibilityStart(parseDateOnly(user.visibility_start_date));
          setVisibilityEnd(parseDateOnly(user.visibility_end_date));
        } else {
          setVisibilityStart(null);
          setVisibilityEnd(null);
        }

        if (user.profileImage?.path) {
          const imageUrl = getMediaUrl(user.profileImage.path);
          setImagePreview(imageUrl);
        }
      } catch {
        toast.error("Failed to load user");
        router.push("/dashboard/users");
      } finally {
        setLoading(false);
        // Defer marking initialized until after this render settles, so
        // the role-watch effect below doesn't fire on the initial reset.
        setHasInitialized(true);
      }
    };
    fetchUser();
  }, [id, reset, router]);

  /**
   * If role switches away from Host/Staff (i.e. to Admin) AFTER initial
   * load, visibility settings no longer apply — reset mode and clear
   * dates. Guarded by hasInitialized so this doesn't fire and wipe out
   * data we just loaded from the server on mount.
   */
  useEffect(() => {
    if (!hasInitialized) return;
    if (!isRestrictedRole) {
      setVisibilityMode("default");
      setVisibilityStart(null);
      setVisibilityEnd(null);
    }
  }, [isRestrictedRole, hasInitialized]);

  const handleVisibilityModeChange = (mode: VisibilityMode) => {
    setVisibilityMode(mode);
    if (mode !== "range") {
      setVisibilityStart(null);
      setVisibilityEnd(null);
    }
  };

  const onSubmit = async (data: EditUserFormInput) => {
    setSubmitting(true);
    try {
      const payload: any = {
        full_name: data.full_name,
        email: data.email,
        status: data.status,
        role_name: data.role_name,
        mobile_number: data.mobile_number,
        enable_otp_login: data.enable_otp_login,
        otp_in_mail: data.otp_in_mail,
        otp_in_sms: data.otp_in_sms,
        hide_guest_contacts: data.hide_guest_contacts,

        file: data.file,
        ...(data.password &&
          data.password.length > 0 && { password: data.password }),
      };

      if (isRestrictedRole && visibilityMode === "range") {
        const start = toDateOnlyString(visibilityStart);
        if (!start) {
          toast.error("A valid start date is required for range visibility.");
          return;
        }

        payload.visibility_mode = "range";
        payload.visibility_start_date = start;

        const end = toDateOnlyString(visibilityEnd);
        if (end) {
          payload.visibility_end_date = end;
        } else {
          delete payload.visibility_end_date;
        }
      } else if (isRestrictedRole && visibilityMode === "all") {
        payload.visibility_mode = "all";
        // Explicit null so the backend actively revokes any previously
        // granted window rather than leaving it untouched.
        payload.visibility_start_date = null;
        payload.visibility_end_date = null;
      } else {
        // Default mode (or role is Admin) — explicitly send null/"default"
        // so the backend revokes any previously granted window.
        payload.visibility_mode = "default";
        payload.visibility_start_date = null;
        payload.visibility_end_date = null;
      }

      if (!isRestrictedRole) {
        delete payload.visibility_mode;
        delete payload.visibility_start_date;
        delete payload.visibility_end_date;
      }

      await updateUser(id, payload);
      toast.success("User updated successfully");
      router.push("/dashboard/users");
    } catch (error: any) {
      const message = error?.response?.data?.message;
      toast.error(
        typeof message === "string" ? message : "Failed to update user",
      );
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
              <FormInput<EditUserFormInput>
                name="full_name"
                control={control as any}
                placeholder="e.g. John Doe"
              />
            </FormField>

            <FormField label="Email" required>
              <FormInput<EditUserFormInput>
                name="email"
                control={control as any}
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
                          {userCreatedAt
                            ? `This user can only see guests/interviews created after ${userCreatedAt.toLocaleDateString(
                                undefined,
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                },
                              )}, their account creation date (plus anything directly assigned to them).`
                            : "This user will only see guests/interviews created after their account is created (plus anything directly assigned to them)."}
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
                          onChange={(date: Date | null) =>
                            setVisibilityStart(date)
                          }
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
                          onChange={(date: Date | null) =>
                            setVisibilityEnd(date)
                          }
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

                  {visibilityMode === "range" &&
                    !isValidDate(visibilityStart) && (
                      <p className="text-xs text-amber-600">
                        A start date is required to grant access to a historical
                        range.
                      </p>
                    )}
                </div>
              </FormField>
            )}

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

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("hide_guest_contacts")}
                id="hide_guest_contacts"
                className="rounded border-gray-300"
              />
              <label
                htmlFor="hide_guest_contacts"
                className="text-sm font-medium text-gray-700"
              >
                Hide guest contact details
              </label>
            </div>
            <p className="text-xs text-gray-500 -mt-3">
              When enabled, this user can only see the email/phone of guests
              they created, are assigned to as host, or have interviewed.
            </p>
            {errors.hide_guest_contacts && (
              <p className="text-red-600 text-sm">
                {errors.hide_guest_contacts.message}
              </p>
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
