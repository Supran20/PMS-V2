import { z } from "zod";
import type {
  AssignPlanPayload,
  CreateChannelPayload,
} from "@/lib/api/channel";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const mobileRegex = /^\+?[1-9]\d{7,14}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const SUBSCRIPTION_STATUS_OPTIONS = [
  { value: "", label: "Not set" },
  { value: "trialing", label: "Trialing" },
  { value: "active", label: "Active" },
  { value: "past_due", label: "Past due" },
  { value: "cancelled", label: "Cancelled" },
] as const;

/**
 * --------------------------------
 * Helpers
 * --------------------------------
 */

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// "2026-11-30" -> end of that day in the browser's timezone, as an ISO string.
const parseEndOfDay = (date: string) => new Date(`${date}T23:59:59`);
export const endOfDayISO = (date: string) => parseEndOfDay(date).toISOString();

// ISO string -> "YYYY-MM-DD" in the browser's timezone, for <input type="date">.
export const toDateInputValue = (iso: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const dateField = z
  .string()
  .trim()
  .refine((v) => v === "" || dateRegex.test(v), "Invalid date");

const subscriptionStatusField = z.enum([
  "",
  "trialing",
  "active",
  "past_due",
  "cancelled",
]);

/**
 * --------------------------------
 * Create Schema
 * --------------------------------
 * Mirrors the backend rules: a trial channel needs a future end date.
 * Blank strings mean "not set" and are converted to null on submit.
 */
export const createChannelFormSchema = z
  .object({
    channel_name: z.string().trim().min(1, "Channel name is required"),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, "Slug is required")
      .regex(
        slugRegex,
        "Slug can only contain lowercase letters, numbers and single hyphens",
      ),
    status: z.enum(["trial", "active"]),
    subscription_plan_id: z.string(),
    subscription_status: subscriptionStatusField,
    trial_ends_at: dateField,
    admin: z.object({
      full_name: z
        .string()
        .trim()
        .min(3, "Full name must be at least 3 characters"),
      email: z.string().trim().email("Invalid email address"),
      password: z.string().min(8, "Password must be at least 8 characters"),
      confirm_password: z.string().min(1, "Please re-enter the password"),
      mobile_number: z
        .string()
        .trim()
        .refine((v) => v === "" || mobileRegex.test(v), "Invalid phone number"),
    }),
  })
  .superRefine((data, ctx) => {
    if (data.admin.password !== data.admin.confirm_password) {
      ctx.addIssue({
        code: "custom",
        path: ["admin", "confirm_password"],
        message: "Passwords do not match",
      });
    }

    if (data.status === "trial") {
      if (!data.trial_ends_at) {
        ctx.addIssue({
          code: "custom",
          path: ["trial_ends_at"],
          message: "Trial end date is required for a trial channel",
        });
      } else if (parseEndOfDay(data.trial_ends_at) <= new Date()) {
        ctx.addIssue({
          code: "custom",
          path: ["trial_ends_at"],
          message: "Trial end date must be in the future",
        });
      }
    }
  });

export type CreateChannelFormInput = z.infer<typeof createChannelFormSchema>;

export const toCreateChannelPayload = (
  data: CreateChannelFormInput,
): CreateChannelPayload => ({
  channel_name: data.channel_name,
  slug: data.slug,
  status: data.status,
  subscription_plan_id: data.subscription_plan_id || null,
  subscription_status: data.subscription_status || null,
  trial_ends_at: data.trial_ends_at ? endOfDayISO(data.trial_ends_at) : null,
  admin: {
    full_name: data.admin.full_name,
    email: data.admin.email,
    password: data.admin.password,
    // Backend rejects "" (regex), so omit it when blank.
    ...(data.admin.mobile_number
      ? { mobile_number: data.admin.mobile_number }
      : {}),
  },
});

/**
 * --------------------------------
 * Update (name) Schema
 * --------------------------------
 */
export const updateChannelFormSchema = z.object({
  channel_name: z.string().trim().min(1, "Channel name is required"),
});

export type UpdateChannelFormInput = z.infer<typeof updateChannelFormSchema>;

/**
 * --------------------------------
 * Assign Plan Schema
 * --------------------------------
 * The form is prefilled with the channel's current values, so a blank field
 * means "clear it" and is sent as null.
 */
export const assignPlanFormSchema = z
  .object({
    subscription_plan_id: z.string(),
    subscription_status: subscriptionStatusField,
    trial_ends_at: dateField,
  })
  .superRefine((data, ctx) => {
    if (data.subscription_status === "trialing" && !data.trial_ends_at) {
      ctx.addIssue({
        code: "custom",
        path: ["trial_ends_at"],
        message: "Trial end date is required when status is Trialing",
      });
    }
  });

export type AssignPlanFormInput = z.infer<typeof assignPlanFormSchema>;

export const toAssignPlanPayload = (
  data: AssignPlanFormInput,
): AssignPlanPayload => ({
  subscription_plan_id: data.subscription_plan_id || null,
  subscription_status: data.subscription_status || null,
  trial_ends_at: data.trial_ends_at ? endOfDayISO(data.trial_ends_at) : null,
});
