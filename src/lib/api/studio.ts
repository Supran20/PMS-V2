import api from "@/lib/axios";

/**
 * --------------------------------
 * Types
 * --------------------------------
 */

export interface StudioPayload {
  studio_name: string;
  address?: string | null;
  slug: string;
}

export interface Studio {
  id: string;
  studio_name: string;
  address: string | null;
  slug: string;
  created_by?: string | null;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * --------------------------------
 * GET ALL STUDIOS
 * --------------------------------
 */
export const getStudios = async (): Promise<Studio[]> => {
  const response = await api.get("/studios");
  const res = response.data;

  return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
};

/**
 * --------------------------------
 * GET STUDIO BY ID
 * --------------------------------
 */
export const getStudioById = async (id: string): Promise<Studio> => {
  const response = await api.get(`/studios/${id}`);
  return response.data.data;
};

/**
 * --------------------------------
 * GET STUDIO BY SLUG
 * --------------------------------
 */
export const getStudioBySlug = async (slug: string): Promise<Studio> => {
  const response = await api.get(`/studios/slug/${slug}`);
  return response.data.data;
};

/**
 * --------------------------------
 * CREATE STUDIO
 * --------------------------------
 */
export const createStudio = async (payload: StudioPayload): Promise<Studio> => {
  const response = await api.post("/studios", payload);
  return response.data.data;
};

/**
 * --------------------------------
 * UPDATE STUDIO BY ID
 * --------------------------------
 */
export const updateStudio = async (
  id: string,
  payload: Partial<StudioPayload>,
): Promise<Studio> => {
  const response = await api.put(`/studios/${id}`, payload);
  return response.data.data;
};

/**
 * --------------------------------
 * UPDATE STUDIO BY SLUG
 * --------------------------------
 */
export const updateStudioBySlug = async (
  slug: string,
  payload: Partial<StudioPayload>,
): Promise<Studio> => {
  const response = await api.put(`/studios/slug/${slug}`, payload);
  return response.data.data;
};

/**
 * --------------------------------
 * DELETE STUDIO
 * --------------------------------
 */
export const deleteStudio = async (id: string): Promise<void> => {
  await api.delete(`/studios/${id}`);
};
