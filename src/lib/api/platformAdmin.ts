import api from "@/lib/axios";

/**
 * --------------------------------
 * Types
 * --------------------------------
 */

export interface PlatformAdminMedia {
  id: string;
  media_name: string;
  path: string;
  type: string;
}

export interface PlatformAdminUser {
  id: string;
  channel_id: string;
  full_name: string;
  email: string;
  status: string;
  mobile_number?: string | null;
  profile_image?: string | null;
  profileImage?: PlatformAdminMedia | null;
}

export interface PlatformAdmin {
  id: string;
  user_id: string;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  user?: PlatformAdminUser;
}

export interface CreatePlatformAdminPayload {
  full_name: string;
  email: string;
  password: string;
  mobile_number?: string;
  file?: File;
}

// ASSUMPTION: confirm this matches how platform_admin.routes.ts is actually
// mounted in your routes aggregator (index.ts). Update if different.
const BASE_PATH = "/admin/platform-admins";

/**
 * --------------------------------
 * FormData serialization helper
 * (multipart, same reasoning as user.ts — profile image upload)
 * --------------------------------
 */
function appendPayloadToFormData(
  formData: FormData,
  payload: Record<string, unknown>,
) {
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    formData.append(key, String(value));
  });
}

/**
 * --------------------------------
 * GET ALL PLATFORM ADMINS
 * --------------------------------
 */
export const getPlatformAdmins = async (): Promise<PlatformAdmin[]> => {
  const response = await api.get(BASE_PATH);
  const res = response.data;
  return Array.isArray(res?.data) ? res.data : [];
};

/**
 * --------------------------------
 * GET PLATFORM ADMIN BY ID
 * --------------------------------
 */
export const getPlatformAdminById = async (
  id: string,
): Promise<PlatformAdmin> => {
  const response = await api.get(`${BASE_PATH}/${id}`);
  return response.data.data;
};

/**
 * --------------------------------
 * CREATE PLATFORM ADMIN
 * --------------------------------
 */
export const createPlatformAdmin = async (
  payload: CreatePlatformAdminPayload,
): Promise<PlatformAdmin> => {
  const formData = new FormData();
  const { file, ...rest } = payload;

  appendPayloadToFormData(formData, rest);

  if (file instanceof File) {
    formData.append("file", file);
  }

  const response = await api.post(BASE_PATH, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data.data;
};

/**
 * --------------------------------
 * REVOKE (DELETE) PLATFORM ADMIN
 * --------------------------------
 */
export const revokePlatformAdmin = async (id: string): Promise<void> => {
  await api.delete(`${BASE_PATH}/${id}`);
};
