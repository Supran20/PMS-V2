// lib/api/media.ts
import api from "@/lib/axios";

/**
 * --------------------------------
 * Types
 * --------------------------------
 */

export interface MediaPayload {
  media_name: string;
  tag_id?: string | null;
  file?: File; // optional if uploading via FormData
}

export interface Tag {
  id: string;
  tag_name: string;
}

export interface Media {
  id: string;
  media_name: string;
  path: string;
  type: string;
  tag_id?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
  tag?: Tag;
}

/**
 * --------------------------------
 * GET ALL MEDIA
 * --------------------------------
 */
export const getMedia = async (): Promise<Media[]> => {
  const response = await api.get("/media");
  const res = response.data;
  return Array.isArray(res?.data) ? res.data : [];
};

/**
 * --------------------------------
 * GET MEDIA BY ID
 * --------------------------------
 */
export const getMediaById = async (id: string): Promise<Media> => {
  const response = await api.get(`/media/${id}`);
  return response.data.data;
};

/**
 * --------------------------------
 * CREATE MEDIA
 * --------------------------------
 */
export const createMedia = async (payload: MediaPayload): Promise<Media> => {
  const formData = new FormData();
  formData.append("media_name", payload.media_name);
  if (payload.tag_id) formData.append("tag_id", payload.tag_id);
  if (payload.file) formData.append("file", payload.file);

  const response = await api.post("/media", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
};

/**
 * --------------------------------
 * UPDATE MEDIA
 * --------------------------------
 */
export const updateMedia = async (
  id: string,
  payload: Partial<MediaPayload>,
): Promise<Media> => {
  const formData = new FormData();

  if (payload.media_name !== undefined) {
    formData.append("media_name", payload.media_name);
  }

  if (payload.tag_id !== undefined) {
    if (payload.tag_id === null) {
      formData.append("tag_id", "");
    } else {
      formData.append("tag_id", payload.tag_id);
    }
  }

  if (payload.file) {
    formData.append("file", payload.file);
  }

  const response = await api.put(`/media/${id}`, formData);
  return response.data.data;
};

/**
 * --------------------------------
 * DELETE MEDIA
 * --------------------------------
 */
export const deleteMedia = async (id: string): Promise<void> => {
  await api.delete(`/media/${id}`);
};
