"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ChannelStatusBadge } from "@/components/channels/ChannelStatusBadge";
import {
  Channel,
  assignChannelPlan,
  getChannelById,
  updateChannel,
} from "@/lib/api/channel";
import { getPlans, SubscriptionPlan } from "@/lib/api/subscriptionPlan";
import {
  AssignPlanFormInput,
  UpdateChannelFormInput,
  SUBSCRIPTION_STATUS_OPTIONS,
  assignPlanFormSchema,
  toAssignPlanPayload,
  toDateInputValue,
  updateChannelFormSchema,
} from "@/lib/validations/channel.validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormField } from "@/components/ui/FormField";
import { FormInput } from "@/components/ui/FormInput";
import { PageHeader } from "@/components/ui/PageHeader";

const selectClass =
  "w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed";

const submitButtonClass =
  "rounded-md text-white bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500";

const toPlanFormValues = (channel: Channel): AssignPlanFormInput => ({
  subscription_plan_id: channel.subscription_plan_id ?? "",
  subscription_status: channel.subscription_status ?? "",
  trial_ends_at: toDateInputValue(channel.trial_ends_at),
});

export default function EditChannelPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [savingName, setSavingName] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);

  const {
    control: nameControl,
    handleSubmit: handleNameSubmit,
    reset: resetName,
  } = useForm<UpdateChannelFormInput>({
    resolver: zodResolver(updateChannelFormSchema),
    defaultValues: { channel_name: "" },
  });

  const {
    register: planRegister,
    handleSubmit: handlePlanSubmit,
    reset: resetPlan,
    formState: { errors: planErrors },
  } = useForm<AssignPlanFormInput>({
    resolver: zodResolver(assignPlanFormSchema),
    defaultValues: {
      subscription_plan_id: "",
      subscription_status: "",
      trial_ends_at: "",
    },
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [channelData, planData] = await Promise.all([
          getChannelById(id),
          getPlans(),
        ]);
        if (cancelled) return;

        resetName({ channel_name: channelData.channel_name });
        resetPlan(toPlanFormValues(channelData));
        setChannel(channelData);
        setPlans(planData);
      } catch {
        if (cancelled) return;
        toast.error("Failed to load channel");
        router.push("/dashboard/platform-admin/channels");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [id, resetName, resetPlan, router]);

  const onSaveName = async (data: UpdateChannelFormInput) => {
    setSavingName(true);
    try {
      const updated = await updateChannel(id, data);
      // The update response has no plan include, so merge to keep it.
      setChannel((prev) => (prev ? { ...prev, ...updated } : updated));
      resetName({ channel_name: updated.channel_name });
      toast.success("Channel updated successfully");
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Failed to update channel");
    } finally {
      setSavingName(false);
    }
  };

  const onSavePlan = async (data: AssignPlanFormInput) => {
    setSavingPlan(true);
    try {
      const updated = await assignChannelPlan(id, toAssignPlanPayload(data));
      setChannel(updated);
      resetPlan(toPlanFormValues(updated));
      toast.success("Subscription updated successfully");
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err?.response?.data?.message ?? "Failed to update subscription",
      );
    } finally {
      setSavingPlan(false);
    }
  };

  const isCancelled = channel?.status === "cancelled";

  // Active plans, plus the channel's current plan even if it was deactivated.
  const planOptions = plans.filter(
    (p) => p.is_active || p.id === channel?.subscription_plan_id,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Channel"
        backHref="/dashboard/platform-admin/channels"
      />

      {loading || !channel ? (
        <Card className="shadow-lg bg-white border-none px-5 md:px-0 py-5">
          <CardContent>
            <p className="text-sm text-gray-500">Loading...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Channel details */}
          <Card className="shadow-lg bg-white border-none px-5 md:px-0 py-5">
            <CardContent>
              <form
                onSubmit={handleNameSubmit(onSaveName)}
                className="space-y-5"
              >
                <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Channel Details
                </h3>

                <FormField label="Channel Name" required>
                  <FormInput<UpdateChannelFormInput>
                    name="channel_name"
                    control={nameControl}
                    placeholder="e.g. Tech Talks Nepal"
                  />
                </FormField>

                <FormField label="Slug">
                  <input
                    type="text"
                    value={channel.slug}
                    disabled
                    readOnly
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 text-gray-500 text-sm cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Slug cannot be changed.
                  </p>
                </FormField>

                <FormField label="Status">
                  <div>
                    <ChannelStatusBadge status={channel.status} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Use Suspend / Reactivate on the channels list to change the
                    status.
                  </p>
                </FormField>

                <div className="flex pt-2 md:justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={savingName}
                    className={submitButtonClass}
                  >
                    {savingName ? "Saving..." : "Save Details"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Subscription */}
          <Card className="shadow-lg bg-white border-none px-5 md:px-0 py-5">
            <CardContent>
              <form
                onSubmit={handlePlanSubmit(onSavePlan)}
                className="space-y-5"
              >
                <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Subscription
                </h3>

                {/* fieldset disables every input inside it */}
                <fieldset disabled={isCancelled} className="space-y-5">
                  {isCancelled && (
                    <p className="text-sm text-amber-700">
                      This channel is cancelled, so its subscription cannot be
                      changed.
                    </p>
                  )}

                  <FormField label="Plan">
                    <select
                      {...planRegister("subscription_plan_id")}
                      className={selectClass}
                    >
                      <option value="">No plan</option>
                      {planOptions.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.plan_name} ({plan.billing_interval})
                          {plan.is_active ? "" : " - inactive"}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Subscription Status">
                    <select
                      {...planRegister("subscription_status")}
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
                      {...planRegister("trial_ends_at")}
                      className={selectClass}
                    />
                    {planErrors.trial_ends_at && (
                      <p className="text-red-600 text-sm mt-1">
                        {planErrors.trial_ends_at.message}
                      </p>
                    )}
                  </FormField>
                </fieldset>

                <div className="flex pt-2 md:justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={savingPlan || isCancelled}
                    className={submitButtonClass}
                  >
                    {savingPlan ? "Saving..." : "Save Subscription"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
