import api from "@/lib/axios";
import type { Guest } from "@/lib/api/guest";
import type { Interview } from "@/lib/api/interview";

/**
 * --------------------------------
 * Types
 * --------------------------------
 */

export type ReapprovalTriggerSource =
  | "duplicate_guest_attempt"
  | "repeat_booking";

export type ReapprovalStatus = "pending" | "approved" | "rejected";

export interface CreateReapprovalRequestPayload {
  guest_id: string;
  proposed_host_id?: string | null;
  interview_id?: string | null;
  trigger_source: ReapprovalTriggerSource;
}

export interface ReviewReapprovalRequestPayload {
  review_note?: string | null;
}

export interface GuestReapprovalRequest {
  id: string;

  guest_id: string;
  requested_by: string;
  proposed_host_id: string | null;
  interview_id: string | null;

  trigger_source: ReapprovalTriggerSource;
  status: ReapprovalStatus;

  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;

  // Populated via REVIEW_INCLUDE on the backend
  guest?: Guest | null;
  requester?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  proposedHost?: {
    id: string;
    full_name: string;
  } | null;
  reviewer?: {
    id: string;
    full_name: string;
  } | null;
  interview?: Interview | null;

  created_by: string | null;
  updated_by: string | null;

  created_at: string;
  updated_at: string;
}

/**
 * --------------------------------
 * CREATE REAPPROVAL REQUEST
 * --------------------------------
 * Explicit, user-confirmed request — called when the person clicks
 * "Request Access" in the duplicate-guest modal.
 */
export const createReapprovalRequest = async (
  payload: CreateReapprovalRequestPayload,
): Promise<GuestReapprovalRequest> => {
  const response = await api.post("/guest-reapproval-requests", payload);
  return response.data.data;
};

/**
 * --------------------------------
 * GET ALL REAPPROVAL REQUESTS
 * --------------------------------
 */
export const getReapprovalRequests = async (
  status?: ReapprovalStatus,
): Promise<GuestReapprovalRequest[]> => {
  const response = await api.get("/guest-reapproval-requests", {
    params: status ? { status } : undefined,
  });
  const res = response.data;

  return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
};

/**
 * --------------------------------
 * GET REAPPROVAL REQUEST BY ID
 * --------------------------------
 */
export const getReapprovalRequestById = async (
  id: string,
): Promise<GuestReapprovalRequest> => {
  const response = await api.get(`/guest-reapproval-requests/${id}`);
  return response.data.data;
};

/**
 * --------------------------------
 * APPROVE REAPPROVAL REQUEST
 * --------------------------------
 */
export const approveReapprovalRequest = async (
  id: string,
  payload?: ReviewReapprovalRequestPayload,
): Promise<GuestReapprovalRequest> => {
  const response = await api.patch(
    `/guest-reapproval-requests/${id}/approve`,
    payload ?? {},
  );
  return response.data.data;
};

/**
 * --------------------------------
 * REJECT REAPPROVAL REQUEST
 * --------------------------------
 */
export const rejectReapprovalRequest = async (
  id: string,
  payload?: ReviewReapprovalRequestPayload,
): Promise<GuestReapprovalRequest> => {
  const response = await api.patch(
    `/guest-reapproval-requests/${id}/reject`,
    payload ?? {},
  );
  return response.data.data;
};
