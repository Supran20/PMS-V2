"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { createUser } from "@/lib/api/user";
import { getPermissions, Permission } from "@/lib/api/permissions";
import { getRoles, getRolePermissions, Role } from "@/lib/api/roles";
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

export default function AddUserPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [loadingDefaults, setLoadingDefaults] = useState(false);

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
      permission_ids: [],
    },
  });
  const enableOtp = watch("enable_otp_login");
  const roleName = watch("role_name");
  const permissionIds = watch("permission_ids") ?? [];

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Load the full permission catalog and the role list (id + role_name) once.
  useEffect(() => {
    (async () => {
      try {
        const [permsData, rolesData] = await Promise.all([
          getPermissions(),
          getRoles(),
        ]);
        setPermissions(permsData);
        setRoles(rolesData);
      } catch {
        toast.error("Failed to load permissions");
      } finally {
        setLoadingPermissions(false);
      }
    })();
  }, []);

  // Whenever the selected role changes (including the initial default role),
  // pre-fill permission_ids with that role's default permission set.
  // Super Admin is bypassed server-side, so permissions are cleared and hidden.
  useEffect(() => {
    if (!roles.length) return;

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
          { shouldValidate: true },
        );
      } catch {
        toast.error("Failed to load default permissions for role");
      } finally {
        setLoadingDefaults(false);
      }
    })();
  }, [roleName, roles, setValue]);

  const togglePermission = (id: string) => {
    const current = watch("permission_ids") ?? [];
    const next = current.includes(id)
      ? current.filter((pid) => pid !== id)
      : [...current, id];
    setValue("permission_ids", next, { shouldValidate: true });
  };

  const onSubmit = async (data: CreateUserInput) => {
    setSubmitting(true);
    try {
      await createUser(data);
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
