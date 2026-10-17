import { z } from "zod";
import type { SubscriptionPlanPayload } from "@/lib/api/subscriptionPlan";

// Limits are kept as strings in the form. Blank means unlimited (null).
const optionalLimit = (label: string) =>
  z
    .string()
    .trim()
    .refine(
      (v) => v === "" || /^[1-9]\d*$/.test(v),
      `${label} must be a whole number greater than 0`,
    );

export const subscriptionPlanSchema = z.object({
  plan_name: z.string().trim().min(1, "Plan name is required"),
  description: z.string().trim(),
  price: z
    .string()
    .trim()
    .min(1, "Price is required")
    .refine(
      (v) => /^\d+(\.\d{1,2})?$/.test(v),
      "Enter a valid price (up to 2 decimal places)",
    ),
  billing_interval: z.enum(["monthly", "yearly"]),
  max_users: optionalLimit("Max users"),
  max_interviews_per_month: optionalLimit("Max interviews per month"),
  storage_limit_mb: optionalLimit("Storage limit"),
  is_active: z.boolean(),
});

export type SubscriptionPlanFormInput = z.infer<typeof subscriptionPlanSchema>;

const toIntOrNull = (value: string): number | null =>
  value.trim() === "" ? null : Number(value);

export const toSubscriptionPlanPayload = (
  data: SubscriptionPlanFormInput,
): SubscriptionPlanPayload => ({
  plan_name: data.plan_name,
  description: data.description === "" ? null : data.description,
  price: Number(data.price),
  billing_interval: data.billing_interval,
  max_users: toIntOrNull(data.max_users),
  max_interviews_per_month: toIntOrNull(data.max_interviews_per_month),
  storage_limit_mb: toIntOrNull(data.storage_limit_mb),
  is_active: data.is_active,
});
