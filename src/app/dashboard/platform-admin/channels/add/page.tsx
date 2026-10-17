"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { createChannel } from "@/lib/api/channel";
import { getPlans, SubscriptionPlan } from "@/lib/api/subscriptionPlan";
import {
  createChannelFormSchema,
  CreateChannelFormInput,
  toCreateChannelPayload,
  slugify,
  SUBSCRIPTION_STATUS_OPTIONS,
} from "@/lib/validations/channel.validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormField } from "@/components/ui/FormField";
import { FormInput } from "@/components/ui/FormInput";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormActions } from "@/components/ui/FormActions";

const selectClass =
  "w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent";

export default function AddChannelPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

  const {
    control,
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<CreateChannelFormInput>({
    resolver: zodResolver(createChannelFormSchema),
    defaultValues: {
      channel_name: "",
      slug: "",
      status: "trial",
      subscription_plan_id: "",
      subscription_status: "",
      trial_ends_at: "",
      admin: {
        full_name: "",
        email: "",
        password: "",
        confirm_password: "",
        mobile_number: "",
      },
    },
  });

  useEffect(() => {
    let cancelled = false;

    const loadPlans = async () => {
      try {
        const data = await getPlans();
        if (!cancelled) setPlans(data.filter((p) => p.is_active));
      } catch {
        if (!cancelled) toast.error("Failed to load subscription plans");
      }
    };

    loadPlans();

    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (data: CreateChannelFormInput) => {
    setSubmitting(true);
    try {
      await createChannel(toCreateChannelPayload(data));
      toast.success("Channel created successfully");
      router.push("/dashboard/platform-admin/channels");
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      const message =
        err?.response?.data?.message ?? "Failed to create channel";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Channel"
        backHref="/dashboard/platform-admin/channels"
      />

      <Card className="shadow-lg bg-white border-none px-5 md:px-0 py-5">
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Channel details */}
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Channel Details
            </h3>

            <FormField label="Channel Name" required>
              <FormInput<CreateChannelFormInput>
                name="channel_name"
                control={control}
                placeholder="e.g. Tech Talks Nepal"
                onBlur={() => {
                  // Suggest a slug from the name, only if none was typed yet.
                  if (!getValues("slug")) {
                    const suggested = slugify(getValues("channel_name"));
                    if (suggested) {
                      setValue("slug", suggested, { shouldValidate: true });
                    }
                  }
                }}
              />
            </FormField>

            <FormField label="Slug" required>
              <FormInput<CreateChannelFormInput>
                name="slug"
                control={control}
                placeholder="e.g. tech-talks-nepal"
              />
              <p className="text-xs text-gray-400">
                Lowercase letters, numbers and hyphens. It cannot be changed
                later.
              </p>
            </FormField>

            <FormField label="Status" required>
              <select {...register("status")} className={selectClass}>
                <option value="trial">Trial</option>
                <option value="active">Active</option>
              </select>
            </FormField>

            {/* Subscription */}
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2 pt-4">
              Subscription
            </h3>

            <FormField label="Plan">
              <select
                {...register("subscription_plan_id")}
                className={selectClass}
              >
                <option value="">No plan</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.plan_name} ({plan.billing_interval})
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Subscription Status">
              <select
                {...register("subscription_status")}
                className={selectClass}
              >
                {SUBSCRIPTION_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Trial Ends On">
              <input
                type="date"
                {...register("trial_ends_at")}
                className={selectClass}
              />
              <p className="text-xs text-gray-400">
                Required for trial channels.
              </p>
              {errors.trial_ends_at && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.trial_ends_at.message}
                </p>
              )}
            </FormField>

            {/* First Super Admin */}
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2 pt-4">
              First Super Admin
            </h3>

            <FormField label="Full Name" required>
              <FormInput<CreateChannelFormInput>
                name="admin.full_name"
                control={control}
                placeholder="e.g. John Doe"
              />
            </FormField>

            <FormField label="Email" required>
              <FormInput<CreateChannelFormInput>
                name="admin.email"
                control={control}
                placeholder="e.g. john@example.com"
                type="email"
              />
            </FormField>

            <FormField label="Password" required>
              <FormInput<CreateChannelFormInput>
                name="admin.password"
                control={control}
                placeholder="Enter a strong password"
                type="password"
              />
            </FormField>

            <FormField label="Re-enter Password" required>
              <FormInput<CreateChannelFormInput>
                name="admin.confirm_password"
                control={control}
                placeholder="Re-enter password"
                type="password"
              />
            </FormField>

            <FormField label="Mobile Number">
              <FormInput<CreateChannelFormInput>
                name="admin.mobile_number"
                control={control}
                placeholder="e.g. 98XXXXXXXX"
              />
            </FormField>

            <FormActions
              cancelHref="/dashboard/platform-admin/channels"
              submitLabel="Create Channel"
              loadingLabel="Creating..."
              isSubmitting={submitting}
            />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
