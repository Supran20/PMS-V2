import api from "@/lib/axios";
import type { SubscriptionPlan } from "@/lib/api/subscriptionPlan";

/**
 * --------------------------------
 * Types
 * --------------------------------
 */

export type ChannelStatus = "active" | "trial" | "suspended" | "cancelled";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "cancelled";

// The seeded default channel is locked: it cannot be edited or suspended.
export const DEFAULT_CHANNEL_SLUG = "default";

export const isDefaultChannel = (channel: Pick<Channel, "slug">): boolean =>
  channel.slug === DEFAULT_CHANNEL_SLUG;

export interface Channel {
  id: string;
  channel_name: string;
  slug: string;
  status: ChannelStatus;
  subscription_plan_id: string | null;
  subscription_status: SubscriptionStatus | null;
  trial_ends_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  subscriptionPlan?: SubscriptionPlan | null;
}

export interface CreatedChannel extends Channel {
  admin: { id: string; full_name: string; email: string };
}

export interface CreateChannelPayload {
  channel_name: string;
  slug: string;
  status: "active" | "trial";
  subscription_plan_id: string | null;
  subscription_status: SubscriptionStatus | null;
  trial_ends_at: string | null;
  admin: {
    full_name: string;
    email: string;
    password: string;
    mobile_number?: string;
  };
}

export interface UpdateChannelPayload {
  channel_name: string;
}

export interface AssignPlanPayload {
  // null clears the plan
  subscription_plan_id: string | null;
  subscription_status: SubscriptionStatus | null;
  trial_ends_at: string | null;
}

// ASSUMPTION: mounted under /admin like platform-admins and subscription-plans.
const BASE_PATH = "/admin/channels";

/**
 * --------------------------------
 * GET ALL CHANNELS
 * --------------------------------
 */
export const getChannels = async (): Promise<Channel[]> => {
  const response = await api.get(BASE_PATH);
  const res = response.data;
  return Array.isArray(res?.data) ? res.data : [];
};

/**
 * --------------------------------
 * GET CHANNEL BY ID
 * --------------------------------
 */
export const getChannelById = async (id: string): Promise<Channel> => {
  const response = await api.get(`${BASE_PATH}/${id}`);
  return response.data.data;
};

/**
 * --------------------------------
 * CREATE CHANNEL (+ first Super Admin)
 * --------------------------------
 */
export const createChannel = async (
  payload: CreateChannelPayload,
): Promise<CreatedChannel> => {
  const response = await api.post(BASE_PATH, payload);
  return response.data.data;
};

/**
 * --------------------------------
 * UPDATE CHANNEL (name only)
 * --------------------------------
 */
export const updateChannel = async (
  id: string,
  payload: UpdateChannelPayload,
): Promise<Channel> => {
  const response = await api.put(`${BASE_PATH}/${id}`, payload);
  return response.data.data;
};

/**
 * --------------------------------
 * ASSIGN PLAN
 * --------------------------------
 */
export const assignChannelPlan = async (
  id: string,
  payload: AssignPlanPayload,
): Promise<Channel> => {
  const response = await api.patch(`${BASE_PATH}/${id}/plan`, payload);
  return response.data.data;
};

/**
 * --------------------------------
 * SUSPEND / REACTIVATE
 * --------------------------------
 */
export const suspendChannel = async (id: string): Promise<Channel> => {
  const response = await api.post(`${BASE_PATH}/${id}/suspend`);
  return response.data.data;
};

export const reactivateChannel = async (id: string): Promise<Channel> => {
  const response = await api.post(`${BASE_PATH}/${id}/reactivate`);
  return response.data.data;
};
