import api from "@/lib/axios";

/**
 * --------------------------------
 * Types
 * --------------------------------
 */

export interface InterviewPayload {
  guest_id: string;
  host_id: string;
  studio_id: string;
  interview_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  interview_status?: "scheduled" | "completed" | "cancelled" | "postponed";
  live_status?: "live" | "recorded" | "not_live";
  status?:
    | "scheduled"
    | "postponed"
    | "cancelled"
    | "recorded"
    | "editing"
    | "post_editing"
    | "published";
  google_drive_link?: string | null;
  youtube_link?: string | null;
}

export interface Interview {
  id: string;

  guest_id: string;
  host_id: string;
  studio_id: string;

  interview_date: string | null;
  start_time: string | null;
  end_time: string | null;

  interview_status: "scheduled" | "completed" | "cancelled" | "postponed";
  live_status: "live" | "recorded" | "not_live";
  status:
    | "scheduled"
    | "postponed"
    | "cancelled"
    | "recorded"
    | "editing"
    | "post_editing"
    | "published";

  google_drive_link: string | null;
  youtube_link: string | null;

  created_by?: string | null;
  updated_by?: string | null;

  createdAt: string;
  updatedAt: string;

  guest?: {
    id: string;
    full_name: string;
    email: string;
    slug: string;
  };

  host?: {
    id: string;
    full_name: string;
    email: string;
  };

  studio?: {
    id: string;
    studio_name: string;
    address: string;
  };
}

/**
 * --------------------------------
 * GET ALL INTERVIEWS
 * --------------------------------
 */
export const getInterviews = async (): Promise<Interview[]> => {
  const response = await api.get("/interviews");
  const res = response.data;

  return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
};

/**
 * --------------------------------
 * GET INTERVIEW BY ID
 * --------------------------------
 */
export const getInterviewById = async (id: string): Promise<Interview> => {
  const response = await api.get(`/interviews/${id}`);
  return response.data.data;
};

/**
 * --------------------------------
 * CREATE INTERVIEW
 * --------------------------------
 */
export const createInterview = async (
  payload: InterviewPayload,
): Promise<Interview> => {
  const response = await api.post("/interviews", payload);
  return response.data.data;
};

// --------------------------------
// CHECK OVERLAP
// --------------------------------
export const checkInterviewOverlap = async (params: {
  guest_id: string;
  host_id: string;
  studio_id: string;
  interview_date: string;
  start_time: string;
  end_time: string;
}) => {
  const response = await api.get("/interviews/check-overlap", { params });
  return response.data; // { conflict: boolean, message?: string }
};

/**
 * --------------------------------
 * REORDER INTERVIEW
 * --------------------------------
 */
export const reorderInterviews = async (orderedIds: string[]) => {
  const response = await api.patch("/interviews/reorder", {
    orderedIds,
  });

  return response.data;
};

/**
 * --------------------------------
 * UPDATE INTERVIEW
 * --------------------------------
 */
export const updateInterview = async (
  id: string,
  payload: Partial<InterviewPayload>,
): Promise<Interview> => {
  const response = await api.put(`/interviews/${id}`, payload);
  return response.data.data;
};

/**
 * --------------------------------
 * DELETE INTERVIEW
 * --------------------------------
 */
export const deleteInterview = async (id: string): Promise<void> => {
  await api.delete(`/interviews/${id}`);
};
