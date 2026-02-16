"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@iconify/react";
import { createUser } from "@/lib/api/user";
import {
  createUserSchema,
  CreateUserInput,
} from "@/lib/validations/user.validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function AddUserPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      status: "active",
      role_name: "Staff",
    },
  });

  const onSubmit = async (data: CreateUserInput) => {
    setSubmitting(true);
    try {
      await createUser({
        full_name: data.full_name,
        username: data.username,
        email: data.email,
        password: data.password,
        status: data.status,
        role_name: data.role_name,
        profile_image: data.profile_image,
        mobile_number: data.mobile_number,
        enable_otp_login: data.enable_otp_login,
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
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/users"
          className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Icon icon="mdi:arrow-left" className="text-xl" />
        </Link>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Add User
        </h2>
      </div>

      <Card>
        <CardHeader>Create New User</CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 max-w-lg"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name *
              </label>
              <input
                {...register("full_name")}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Doe"
              />
              {errors.full_name && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.full_name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username *
              </label>
              <input
                {...register("username")}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="johndoe"
              />
              {errors.username && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                {...register("email")}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password *
              </label>
              <input
                type="password"
                {...register("password")}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Min 8 characters"
              />
              {errors.password && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                {...register("status")}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              {errors.status && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.status.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role *
              </label>
              <select
                {...register("role_name")}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            </div>

            <div className="flex gap-3 pt-4">
              <Link href="/dashboard/users">
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? "Creating..." : "Create User"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
