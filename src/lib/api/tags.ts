import api from "@/lib/axios";

/**
 * --------------------------------
 * Types
 * --------------------------------
 */

export interface TagPayload {
  tag_name: string;
  slug?: string;
}

export interface Tag {
  id: string;
  tag_name: string;
  slug: string;
  created_by?: string | null;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * --------------------------------
 * GET ALL TAGS
 * --------------------------------
 */
export const getTags = async (): Promise<Tag[]> => {
  const response = await api.get("/tags");
  const res = response.data;
  return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
};

/**
 * --------------------------------
 * GET TAG BY ID
 * --------------------------------
 */
export const getTagById = async (id: string): Promise<Tag> => {
  const response = await api.get(`/tags/${id}`);
  return response.data.data;
};

/**
 * --------------------------------
 * CREATE TAG
 * --------------------------------
 */
export const createTag = async (payload: TagPayload): Promise<Tag> => {
  const response = await api.post("/tags", payload);
  return response.data.data;
};

/**
 * --------------------------------
 * UPDATE TAG
 * --------------------------------
 */
export const updateTag = async (
  id: string,
  payload: Partial<TagPayload>,
): Promise<Tag> => {
  const response = await api.put(`/tags/${id}`, payload);
  return response.data.data;
};

/**
 * --------------------------------
 * DELETE TAG
 * --------------------------------
 */
export const deleteTag = async (id: string): Promise<void> => {
  await api.delete(`/tags/${id}`);
};
