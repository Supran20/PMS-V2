"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { getUserById, updateUser } from "@/lib/api/user";
import { getPermissions, Permission } from "@/lib/api/permissions";
import { getRoles, getRolePermissions, Role } from "@/lib/api/roles";
import {
  editUserFormSchema,
  EditUserFormInput,
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

/**
 * --------------------------------
 * Permission grouping helpers
 * --------------------------------
 */
function groupPermissions(permissions: Permission[]): [string, Permission[]][] {
  const map = new Map<string, Permission[]>();
  permissions.forEach((permission) => {
    const [resource] = permission.permission_type.split(".");
    if (resource === "logs" || resource === "settings") return;
    const key = resource || "other";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(permission);
  });
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}

function formatGroupLabel(resource: string): string {
  return resource
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatPermissionLabel(permission: Permission): string {
  if (permission.description) return permission.description;
  const [, action] = permission.permission_type.split(".");
  if (!action) return permission.permission_type;
  return action
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [loadingDefaults, setLoadingDefaults] = useState(false);
  const prevRoleRef = useRef<string | null>(null);

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
      status: "active",
      role_name: "Staff",
      permission_ids: [],
    },
  });

  const enableOtp = watch("enable_otp_login");
  const roleName = watch("role_name");
  const permissionIds = watch("permission_ids") ?? [];

  useEffect(() => {
    const fetchUserData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [user, permsData, rolesData] = await Promise.all([
          getUserById(id),
          getPermissions(),
          getRoles(),
        ]);

        setPermissions(permsData);
        setRoles(rolesData);
        setLoadingPermissions(false);

        const userRole =
          (user.roles?.[0]?.role_name as
            | "Admin"
            | "Host"
            | "Staff"
            | "Super Admin") ?? "Staff";
        const userPermIds = user.permissions
          ? user.permissions.map((p) => p.id)
          : [];

        reset({
          full_name: user.full_name,
          email: user.email,
          status: (user.status as "active" | "inactive") ?? "active",
          role_name: userRole,
          mobile_number: user.mobile_number ?? undefined,
          enable_otp_login: user.enable_otp_login ?? false,
          otp_in_mail: user.otp_in_mail ?? false,
          otp_in_sms: user.otp_in_sms ?? false,
          permission_ids: userPermIds,
        });

        prevRoleRef.current = userRole;

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
    fetchUserData();
  }, [id, reset, router]);

  // Whenever the selected role changes after initial load,
  // update permission_ids with that role's default permission set.
  useEffect(() => {
    if (!roles.length || !prevRoleRef.current) return;
    if (roleName === prevRoleRef.current) return;

    prevRoleRef.current = roleName ?? null;

    if (roleName === "Super Admin") {
      setValue("permission_ids", []);
      return;
    }

    const role = roles.find((r) => r.role_name === roleName);
    if (!role) return;

    (async () => {
      setLoadingDefaults(true);
      try {
        const defaults = await getRolePermissions(role.id);
        setValue(
          "permission_ids",
          defaults.map((p) => p.id),
          { shouldValidate: true }
        );
      } catch {
        toast.error("Failed to load default permissions for role");
      } finally {
        setLoadingDefaults(false);
      }
    })();
  }, [roleName, roles, setValue]);

  const togglePermission = (idToToggle: string) => {
    const current = watch("permission_ids") ?? [];
    const next = current.includes(idToToggle)
      ? current.filter((pid) => pid !== idToToggle)
      : [...current, idToToggle];
    setValue("permission_ids", next, { shouldValidate: true });
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
        file: data.file,
        permission_ids:
          data.role_name === "Super Admin" ? [] : data.permission_ids ?? [],
        ...(data.password &&
          data.password.length > 0 && { password: data.password }),
      };

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
                <option value="Super Admin">Super Admin</option>
              </select>
              {errors.role_name && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.role_name.message}
                </p>
              )}
            </FormField>

            {/* Permissions */}
            {roleName === "Super Admin" ? (
              <FormField label="Permissions">
                <p className="text-sm text-gray-500 italic">
                  Super Admin has full access to everything. Individual
                  permissions don&apos;t apply and won&apos;t be assigned.
                </p>
              </FormField>
            ) : (
              <FormField label="Permissions" required>
                {loadingPermissions ? (
                  <p className="text-sm text-gray-500">
                    Loading permissions...
                  </p>
                ) : (
                  <div className="space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                    {loadingDefaults && (
                      <p className="text-xs text-blue-600">
                        Loading {roleName} defaults...
                      </p>
                    )}
                    {groupPermissions(permissions).map(([resource, perms]) => (
                      <div key={resource}>
                        <p className="text-sm font-semibold text-gray-700 mb-2">
                          {formatGroupLabel(resource)}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {perms.map((permission) => (
                            <label
                              key={permission.id}
                              className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={permissionIds.includes(permission.id)}
                                onChange={() => togglePermission(permission.id)}
                                className="rounded border-gray-300"
                              />
                              {formatPermissionLabel(permission)}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {errors.permission_ids && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.permission_ids.message as string}
                  </p>
                )}
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

