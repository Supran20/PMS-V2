"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import {
  getPlatformAdminById,
  updatePlatformAdmin,
} from "@/lib/api/platformAdmin";
import {
  updatePlatformAdminSchema,
  UpdatePlatformAdminInput,
} from "@/lib/validations/platformAdmin.validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormField } from "@/components/ui/FormField";
import { FormInput } from "@/components/ui/FormInput";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormActions } from "@/components/ui/FormActions";
import { getMediaUrl } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

export default function EditPlatformAdminPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user: authUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [existingImagePath, setExistingImagePath] = useState<string | null>(
    null,
  );
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<UpdatePlatformAdminInput>({
    resolver: zodResolver(updatePlatformAdminSchema),
    defaultValues: {
      full_name: "",
      mobile_number: "",
      password: "",
      confirm_password: "",
      status: "active",
      enable_otp_login: false,
      otp_in_mail: false,
      otp_in_sms: false,
    },
  });

  const enableOtp = watch("enable_otp_login");
  const passwordValue = watch("password");

  // Editing your own account: status is locked (backend blocks self-deactivation too).
  const isSelf = !!adminUserId && adminUserId === authUser?.id;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const admin = await getPlatformAdminById(id);
        if (cancelled) return;

        reset({
          full_name: admin.user?.full_name ?? "",
          mobile_number: admin.user?.mobile_number ?? "",
          password: "",
          confirm_password: "",
          status: admin.user?.status === "inactive" ? "inactive" : "active",
          enable_otp_login: !!admin.user?.enable_otp_login,
          otp_in_mail: !!admin.user?.otp_in_mail,
          otp_in_sms: !!admin.user?.otp_in_sms,
        });
        setEmail(admin.user?.email ?? "");
        setAdminUserId(admin.user?.id ?? null);
        setExistingImagePath(admin.user?.profileImage?.path ?? null);
      } catch {
        if (cancelled) return;
        toast.error("Failed to load platform admin");
        router.push("/dashboard/platform-admin/admins");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [id, reset, router]);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const onSubmit = async (data: UpdatePlatformAdminInput) => {
    setSubmitting(true);
    try {
      // confirm_password is frontend-only, never sent to the backend.
      const { confirm_password, ...payload } = data;

      await updatePlatformAdmin(id, {
        ...payload,
        // Never send a status change for your own account.
        status: isSelf ? undefined : payload.status,
      });

      toast.success("Platform admin updated successfully");
      router.push("/dashboard/platform-admin/admins");
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      const message =
        err?.response?.data?.message ?? "Failed to update platform admin";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const currentImage = imagePreview
    ? imagePreview
    : existingImagePath
      ? getMediaUrl(existingImagePath)
      : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Platform Admin"
        backHref="/dashboard/platform-admin/admins"
      />

      <Card className="shadow-lg bg-white border-none px-5 md:px-0 py-5">
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <FormField label="Full Name" required>
                <FormInput<UpdatePlatformAdminInput>
                  name="full_name"
                  control={control}
                  placeholder="e.g. John Doe"
                />
              </FormField>

              <FormField label="Email">
                <input
                  type="email"
                  value={email}
                  disabled
                  readOnly
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 text-gray-500 text-sm cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Email cannot be changed.
                </p>
              </FormField>

              <FormField label="Status">
                <select
                  {...register("status")}
                  disabled={isSelf}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                {isSelf ? (
                  <p className="text-xs text-gray-400 mt-1">
                    You cannot change the status of your own account.
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">
                    Inactive admins cannot log in, and their active sessions
                    stop working.
                  </p>
                )}
              </FormField>

              <FormField label="New Password">
                <FormInput<UpdatePlatformAdminInput>
                  name="password"
                  control={control}
                  placeholder="Leave blank to keep the current password"
                  type="password"
                />
              </FormField>

              {passwordValue ? (
                <FormField label="Re-enter New Password" required>
                  <FormInput<UpdatePlatformAdminInput>
                    name="confirm_password"
                    control={control}
                    placeholder="Re-enter new password"
                    type="password"
                  />
                </FormField>
              ) : null}

              <FormField label="Mobile Number">
                <FormInput<UpdatePlatformAdminInput>
                  name="mobile_number"
                  control={control}
                  placeholder="e.g. 98XXXXXXXX"
                />
              </FormField>

              <FormField label="Profile Image">
                <div className="space-y-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      if (!allowedMimeTypes.includes(file.type)) {
                        toast.error(
                          "Invalid file type. Only jpeg, png, webp images are allowed.",
                        );
                        e.target.value = "";
                        setImagePreview(null);
                        return;
                      }

                      setValue("file", file, { shouldValidate: true });
                      setImagePreview(URL.createObjectURL(file));
                    }}
                    className="w-80 px-4 py-1 rounded-lg border text-xs border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700"
                  />
                  <p className="text-xs text-red-500">
                    Upload only jpg, png or webp image
                  </p>

                  {currentImage && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        {imagePreview ? "New Image Preview" : "Current Image"}
                      </p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentImage}
                        alt="Profile"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>
              </FormField>

              {/* OTP Login */}
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

              {enableOtp && (
                <FormField label="OTP Method (Select One)" required>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={watch("otp_in_mail") === true}
                        onChange={() => {
                          setValue("otp_in_mail", true, {
                            shouldValidate: true,
                          });
                          setValue("otp_in_sms", false, {
                            shouldValidate: true,
                          });
                        }}
                      />
                      Email
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={watch("otp_in_sms") === true}
                        onChange={() => {
                          setValue("otp_in_mail", false, {
                            shouldValidate: true,
                          });
                          setValue("otp_in_sms", true, {
                            shouldValidate: true,
                          });
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

              <FormActions
                cancelHref="/dashboard/platform-admin/admins"
                submitLabel="Update Platform Admin"
                loadingLabel="Updating..."
                isSubmitting={submitting}
              />
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
  