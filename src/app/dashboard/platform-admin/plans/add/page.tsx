"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { createPlan } from "@/lib/api/subscriptionPlan";
import {
  subscriptionPlanSchema,
  SubscriptionPlanFormInput,
  toSubscriptionPlanPayload,
} from "@/lib/validations/subscriptionPlan.validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormActions } from "@/components/ui/FormActions";
import { PlanFormFields } from "@/components/plans/PlatformFields";

export default function AddPlanPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const { control, register, handleSubmit } =
    useForm<SubscriptionPlanFormInput>({
      resolver: zodResolver(subscriptionPlanSchema),
      defaultValues: {
        plan_name: "",
        description: "",
        price: "",
        billing_interval: "monthly",
        max_users: "",
        max_interviews_per_month: "",
        storage_limit_mb: "",
        is_active: true,
      },
    });

  const onSubmit = async (data: SubscriptionPlanFormInput) => {
    setSubmitting(true);
    try {
      await createPlan(toSubscriptionPlanPayload(data));
      toast.success("Subscription plan created successfully");
      router.push("/dashboard/platform-admin/plans");
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      const message =
        err?.response?.data?.message ?? "Failed to create subscription plan";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Subscription Plan"
        backHref="/dashboard/platform-admin/plans"
      />

      <Card className="shadow-lg bg-white border-none px-5 md:px-0 py-5">
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <PlanFormFields control={control} register={register} />

            <FormActions
              cancelHref="/dashboard/platform-admin/plans"
              submitLabel="Create Plan"
              loadingLabel="Creating..."
              isSubmitting={submitting}
            />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
