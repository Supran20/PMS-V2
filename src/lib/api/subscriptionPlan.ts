import api from "@/lib/axios";

/**
 * --------------------------------
 * Types
 * --------------------------------
 */

export type BillingInterval = "monthly" | "yearly";

export interface SubscriptionPlan {
  id: string;
  plan_name: string;
  description: string | null;
  // null = unlimited
  max_users: number | null;
  max_interviews_per_month: number | null;
  storage_limit_mb: number | null;
  // Postgres returns DECIMAL as a string, so always convert before math.
  price: string | number;
  billing_interval: BillingInterval;
  is_active: boolean;
  // Only present on the list endpoint.
  channel_count?: number;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlanPayload {
  plan_name: string;
  description: string | null;
  max_users: number | null;
  max_interviews_per_month: number | null;
  storage_limit_mb: number | null;
  price: number;
  billing_interval: BillingInterval;
  is_active: boolean;
}

// ASSUMPTION: mounted under /admin like platform-admins and channels.
const BASE_PATH = "/admin/subscription-plans";

/**
 * --------------------------------
 * GET ALL PLANS
 * --------------------------------
 */
export const getPlans = async (): Promise<SubscriptionPlan[]> => {
  const response = await api.get(BASE_PATH);
  const res = response.data;
  return Array.isArray(res?.data) ? res.data : [];
};

/**
 * --------------------------------
 * GET PLAN BY ID
 * --------------------------------
 */
export const getPlanById = async (id: string): Promise<SubscriptionPlan> => {
  const response = await api.get(`${BASE_PATH}/${id}`);
  return response.data.data;
};

/**
 * --------------------------------
 * CREATE PLAN
 * --------------------------------
 */
export const createPlan = async (
  payload: SubscriptionPlanPayload,
): Promise<SubscriptionPlan> => {
  const response = await api.post(BASE_PATH, payload);
  return response.data.data;
};

/**
 * --------------------------------
 * UPDATE PLAN
 * --------------------------------
 * Null limits are sent as null (not omitted) so a limit can be cleared back
 * to "unlimited".
 */
export const updatePlan = async (
  id: string,
  payload: Partial<SubscriptionPlanPayload>,
): Promise<SubscriptionPlan> => {
  const response = await api.put(`${BASE_PATH}/${id}`, payload);
  return response.data.data;
};

/**
 * --------------------------------
 * DELETE PLAN
 * --------------------------------
 * Backend returns 409 if any channel still uses the plan.
 */
export const deletePlan = async (id: string): Promise<void> => {
  await api.delete(`${BASE_PATH}/${id}`);
};
