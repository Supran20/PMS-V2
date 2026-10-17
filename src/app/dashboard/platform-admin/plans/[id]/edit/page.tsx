"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { getPlanById, updatePlan } from "@/lib/api/subscriptionPlan";
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

export default function EditPlanPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { control, register, handleSubmit, reset } =
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

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const plan = await getPlanById(id);
        if (cancelled) return;

        reset({
          plan_name: plan.plan_name,
          description: plan.description ?? "",
          // DECIMAL arrives as "2500.00"; Number() normalises it to "2500".
          price: String(Number(plan.price)),
          billing_interval: plan.billing_interval,
          max_users: plan.max_users === null ? "" : String(plan.max_users),
          max_interviews_per_month:
            plan.max_interviews_per_month === null
              ? ""
              : String(plan.max_interviews_per_month),
          storage_limit_mb:
            plan.storage_limit_mb === null ? "" : String(plan.storage_limit_mb),
          is_active: plan.is_active,
        });
      } catch {
        if (cancelled) return;
        toast.error("Failed to load subscription plan");
        router.push("/dashboard/platform-admin/plans");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [id, reset, router]);

  const onSubmit = async (data: SubscriptionPlanFormInput) => {
    setSubmitting(true);
    try {
      await updatePlan(id, toSubscriptionPlanPayload(data));
      toast.success("Subscription plan updated successfully");
      router.push("/dashboard/platform-admin/plans");
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      const message =
        err?.response?.data?.message ?? "Failed to update subscription plan";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Subscription Plan"
        backHref="/dashboard/platform-admin/plans"
      />

      <Card className="shadow-lg bg-white border-none px-5 md:px-0 py-5">
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <PlanFormFields control={control} register={register} />

              <FormActions
                cancelHref="/dashboard/platform-admin/plans"
                submitLabel="Update Plan"
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
