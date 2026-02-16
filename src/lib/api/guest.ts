import api from "@/lib/axios";

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
  email?: string | null;
  phone?: string | null;

  profile_image?: string | null;
  referred_by?: string | null;
}

export interface Media {
  id: string;
  media_name: string;
  path: string;
  type: string;
}

export interface Guest {
  id: string;

  full_name: string;
  designation: string | null;
  slug: string;
  bio: string | null;

  social_media: Record<string, any> | null;
  email: string | null;
  phone: string | null;

  approved: boolean;
  approved_by: string | null;
  referred_by: string | null;

  profile_image: string | null;
  profileImage?: Media | null;

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
export const createGuest = async (payload: GuestPayload): Promise<Guest> => {
  const response = await api.post("/guests", payload);
  return response.data.data;
};

/**
 * --------------------------------
 * UPDATE GUEST BY SLUG
 * --------------------------------
 */
export const updateGuestBySlug = async (
  slug: string,
  payload: Partial<GuestPayload>,
): Promise<Guest> => {
  const response = await api.put(`/guests/slug/${slug}`, payload);
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
 * DELETE GUEST
 * --------------------------------
 */
export const deleteGuest = async (id: string): Promise<void> => {
  await api.delete(`/guests/${id}`);
};
