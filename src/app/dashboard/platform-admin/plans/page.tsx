"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  getPlans,
  updatePlan,
  deletePlan,
  SubscriptionPlan,
} from "@/lib/api/subscriptionPlan";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";

const formatPrice = (price: string | number) =>
  `NPR ${Number(price).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const formatLimit = (value: number | null, suffix = "") =>
  value === null ? "Unlimited" : `${value.toLocaleString("en-IN")}${suffix}`;

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const confirm = useConfirmDialog<{
    plan: SubscriptionPlan;
    action: "deactivate" | "delete";
  }>();

  const loadPlans = async () => {
    setLoading(true);
    try {
      const data = await getPlans();
      setPlans(data);
    } catch {
      toast.error("Failed to load subscription plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const toggleActive = async (plan: SubscriptionPlan): Promise<boolean> => {
    const next = !plan.is_active;

    setBusyId(plan.id);
    try {
      const updated = await updatePlan(plan.id, { is_active: next });
      toast.success(next ? "Plan activated" : "Plan deactivated");
      // Keep channel_count, which the update response doesn't include.
      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, ...updated } : p)),
      );
      return true;
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Failed to update plan");
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const removePlan = async (plan: SubscriptionPlan): Promise<boolean> => {
    setBusyId(plan.id);
    try {
      await deletePlan(plan.id);
      toast.success("Plan deleted");
      setPlans((prev) => prev.filter((p) => p.id !== plan.id));
      return true;
    } catch (error) {
      // Surfaces the backend's 409 "assigned to N channel(s)" message.
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Failed to delete plan");
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirm = async () => {
    if (!confirm.item) return;
    const { plan, action } = confirm.item;

    const ok =
      action === "delete" ? await removePlan(plan) : await toggleActive(plan);
    if (ok) confirm.close();
  };

  const isDeleteAction = confirm.item?.action === "delete";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription Plans"
        actionHref="/dashboard/platform-admin/plans/add"
        actionLabel="Add Plan"
      />

      <Card className="shadow-lg bg-white border-none">
        <CardContent className="p-0">
          {loading ? (
            <p className="text-sm text-gray-500 p-6">Loading...</p>
          ) : plans.length === 0 ? (
            <p className="text-sm text-gray-500 p-6">
              No subscription plans found.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="px-6 py-3 font-medium">Plan</th>
                  <th className="px-6 py-3 font-medium">Price</th>
                  <th className="px-6 py-3 font-medium">Limits</th>
                  <th className="px-6 py-3 font-medium">Channels</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => {
                  const inUse = (plan.channel_count ?? 0) > 0;
                  const busy = busyId === plan.id;

                  return (
                    <tr
                      key={plan.id}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                    >
                      <td className="px-6 py-3">
                        <p className="font-medium text-gray-800">
                          {plan.plan_name}
                        </p>
                        {plan.description && (
                          <p className="text-xs text-gray-500 max-w-xs truncate">
                            {plan.description}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        {formatPrice(plan.price)}
                        <span className="text-gray-400">
                          {" "}
                          /{" "}
                          {plan.billing_interval === "yearly"
                            ? "year"
                            : "month"}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs text-gray-600 space-y-0.5">
                        <p>Users: {formatLimit(plan.max_users)}</p>
                        <p>
                          Interviews/mo:{" "}
                          {formatLimit(plan.max_interviews_per_month)}
                        </p>
                        <p>
                          Storage: {formatLimit(plan.storage_limit_mb, " MB")}
                        </p>
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        {plan.channel_count ?? 0}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={
                            plan.is_active
                              ? "text-green-700 bg-green-50 px-2 py-0.5 rounded-full text-xs font-medium"
                              : "text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full text-xs font-medium"
                          }
                        >
                          {plan.is_active ? "active" : "inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="inline-flex items-center gap-4">
                          <Link
                            href={`/dashboard/platform-admin/plans/${plan.id}/edit`}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            <Icon icon="mdi:pencil-outline" />
                          </Link>

                          <button
                            onClick={() =>
                              plan.is_active
                                ? confirm.open({ plan, action: "deactivate" })
                                : toggleActive(plan)
                            }
                            disabled={busy}
                            className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 disabled:text-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                          >
                            <Icon
                              icon={
                                plan.is_active
                                  ? "mdi:pause-circle-outline"
                                  : "mdi:play-circle-outline"
                              }
                            />
                            {plan.is_active ? "Deactivate" : "Activate"}
                          </button>

                          {!inUse && (
                            <button
                              onClick={() =>
                                confirm.open({ plan, action: "delete" })
                              }
                              disabled={busy}
                              title="Delete plan"
                              className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 disabled:text-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                            >
                              <Icon icon="mdi:trash-can-outline" />
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
      <ConfirmDialog
        open={confirm.isOpen}
        tone={isDeleteAction ? "danger" : "warning"}
        icon={
          isDeleteAction ? "mdi:trash-can-outline" : "mdi:pause-circle-outline"
        }
        title={isDeleteAction ? "Delete this plan?" : "Deactivate this plan?"}
        highlight={confirm.item?.plan.plan_name}
        description={
          isDeleteAction
            ? "This cannot be undone."
            : "It can no longer be assigned to channels. Channels already on it keep it."
        }
        confirmLabel={isDeleteAction ? "Delete plan" : "Deactivate"}
        loading={busyId !== null}
        onConfirm={handleConfirm}
        onClose={confirm.close}
      />
    </div>
  );
}
