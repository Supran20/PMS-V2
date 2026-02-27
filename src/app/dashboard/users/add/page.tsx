"use client";

import React, { useState } from "react";
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

export default function AddUserPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      status: "active",
      role_name: "Staff",
      enable_otp_login: false,
      otp_in_mail: false,
      otp_in_sms: false,
    },
  });

  const enableOtp = watch("enable_otp_login");

  const onSubmit = async (data: CreateUserInput) => {
    setSubmitting(true);
    try {
      await createUser({
        full_name: data.full_name,
        email: data.email,
        password: data.password,
        status: data.status,
        role_name: data.role_name,
        profile_image: data.profile_image,
        mobile_number: data.mobile_number,
        enable_otp_login: data.enable_otp_login,
        otp_in_mail: data.otp_in_mail,
        otp_in_sms: data.otp_in_sms,
      });
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

      <Card className="shadow-lg bg-white border-none py-5">
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormField label="Full Name" required>
              <FormInput<CreateUserInput>
                name="full_name"
                control={control}
                placeholder="e.g. John Doe"
              />
            </FormField>

            <FormField label="Email" required>
              <FormInput<CreateUserInput>
                name="email"
                control={control}
                placeholder="e.g. john@example.com"
                type="email"
              />
            </FormField>

            <FormField label="Password" required>
              <FormInput<CreateUserInput>
                name="password"
                control={control}
                placeholder="Enter a strong password"
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
