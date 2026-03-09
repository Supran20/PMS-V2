import api from "@/lib/axios";
import type { Interview } from "@/lib/api/interview";

/**
 * --------------------------------
 * Types
 * --------------------------------
 */

export interface GuestPayload {
  full_name: string;
  designation?: string | null;
  slug: string;
  bio?: string | null;

  social_media?: Record<string, any> | null;
  notes: { title: string; description: string } | null;
  email?: string | null;
  phone?: string | null;

  profile_image?: string | null;
  referred_by?: string | null;
  host_id: string;
}

export interface Media {
  id: string;
  media_name: string;
  path: string;
  type: string;
  tag_id?: string | null;
}

export interface Guest {
  id: string;

  full_name: string;
  designation: string | null;
  slug: string;
  bio: string | null;

  social_media: Record<string, any> | null;
  notes: { title: string; description: string }[] | null;
  email: string | null;
  phone: string | null;

  approved: boolean;
  approved_by: string | null;

  record: boolean;
  status: "not_started" | "contacted" | "follow_up" | "confirmed";

  referred_by: string | null;
  host_id: string;

  profile_image: string | null;
  profileImage?: Media | null;

  referrer?: {
    id: string;
    full_name: string;
  } | null;

  approver?: {
    id: string;
    full_name: string;
  } | null;

  interviews?: Interview[];

  created_by: string | null;
  updated_by: string | null;

  created_at: string;
  updated_at: string;
}

/**
 * --------------------------------
 * GET ALL GUESTS
 * --------------------------------
 */
export const getGuests = async (): Promise<Guest[]> => {
  const response = await api.get("/guests");
  const res = response.data;

  return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
};

/**
 * --------------------------------
 * GET GUEST BY ID
 * --------------------------------
 */
export const getGuestById = async (id: string): Promise<Guest> => {
  const response = await api.get(`/guests/${id}`);
  return response.data.data;
};

/**
 * --------------------------------
 * GET GUEST BY SLUG
 * --------------------------------
 */
export const getGuestBySlug = async (slug: string): Promise<Guest> => {
  const response = await api.get(`/guests/slug/${slug}`);
  return response.data.data;
};

/**
 * --------------------------------
 * CREATE GUEST
 * --------------------------------
 */
export const createGuest = async (payload: any): Promise<Guest> => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === null || value === undefined) return;

    if (key === "social_media") {
      formData.append(key, JSON.stringify(value));
    } else if (key === "file") {
      formData.append("file", value as File);
    } else {
      formData.append(key, String(value));
    }
  });

  const response = await api.post("/guests", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data.data;
};

/**
 * --------------------------------
 * UPDATE GUEST BY SLUG
 * --------------------------------
 */
export const updateGuestBySlug = async (
  slug: string,
  payload: any,
): Promise<Guest> => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === null || value === undefined) return;

    if (key === "social_media" || key === "notes") {
      formData.append(key, JSON.stringify(value));
    } else if (key === "file") {
      formData.append("file", value as File);
    } else {
      formData.append(key, String(value));
    }
  });

  const response = await api.put(`/guests/slug/${slug}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data.data;
};
/**
 * --------------------------------
 * APPROVE GUEST (Admin Only)
 * --------------------------------
 */
export const approveGuest = async (id: string): Promise<Guest> => {
  const response = await api.patch(`/guests/${id}/approve`);
  return response.data.data;
};

/**
 * --------------------------------
 * TOGGLE RECORD
 * --------------------------------
 */
export const toggleRecordGuest = async (
  slug: string,
  record: boolean,
): Promise<Guest> => {
  const response = await api.put(`/guests/slug/${slug}`, { record });
  return response.data.data;
};

/**
 * --------------------------------
 * STATUS
 * --------------------------------
 */
export const updateGuestStatus = async (
  slug: string,
  status: "not_started" | "contacted" | "follow_up" | "confirmed",
): Promise<Guest> => {
  const response = await api.put(`/guests/slug/${slug}`, { status });
  return response.data.data;
};

/**
 * --------------------------------
 * DELETE GUEST
 * --------------------------------
 */
export const deleteGuest = async (id: string): Promise<void> => {
  await api.delete(`/guests/${id}`);
};
