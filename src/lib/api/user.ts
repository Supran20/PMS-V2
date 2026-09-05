import api from "@/lib/axios";
import { Permission } from "./permissions";

/**
 * --------------------------------
 * Types
 * --------------------------------
 */

export interface UserPayload {
  full_name: string;
  email: string;
  password?: string;
  status?: "active" | "inactive";
  profile_image?: string;
  mobile_number?: string;
  enable_otp_login?: boolean;
  otp_in_mail?: boolean;
  otp_in_sms?: boolean;
  role_name?: "Admin" | "Host" | "Staff" | "Super Admin";
  permission_ids?: string[];
}

export interface Media {
  id: string;
  media_name: string;
  path: string;
  type: string;
  tag_id?: string | null;
}

export interface User {
  otp_in_sms: boolean;
  otp_in_mail: boolean;
  id: string;
  full_name: string;
  email: string;
  status: string;
  profile_image?: string | null;
  profileImage?: Media | null;
  mobile_number?: string | null;
  enable_otp_login?: boolean;

  roles?: {
    id: string;
    role_name: string;
  }[];
  permissions?: Permission[];
  created_at: string;
  updated_at: string;
}

/**
 * --------------------------------
 * FormData serialization helpers
 * --------------------------------
 */
function appendPayloadToFormData(
  formData: FormData,
  payload: Record<string, any>,
) {
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    // Arrays (e.g. permission_ids) can't survive multipart form-data as
    // repeated keys — multer overwrites same-name fields rather than
    // collecting them into an array. Send as a JSON string instead; the
    // backend Zod schema must z.preprocess() this field back into an array
    // before validation (see user.validation.ts on the backend).
    if (Array.isArray(value)) {
      formData.append(key, JSON.stringify(value));
      return;
    }

    formData.append(key, String(value));
  });
}

/**
 * --------------------------------
 * GET ALL USERS
 * --------------------------------
 */
export const getUsers = async (): Promise<User[]> => {
  const response = await api.get("/users");
  const res = response.data;
  return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
};

/**
 * --------------------------------
 * GET USER BY ID
 * --------------------------------
 */
export const getUserById = async (id: string): Promise<User> => {
  const response = await api.get(`/users/${id}`);
  return response.data.data;
};

/**
 * --------------------------------
 * GET USER BY ROLE
 * --------------------------------
 */
export const getHostUser = async (): Promise<User[]> => {
  const response = await api.get(`/users/hosts`);
  return response.data.data;
};

export const getAdminUser = async (): Promise<User[]> => {
  const response = await api.get(`/users/admins`);
  return response.data.data;
};

/**
 * --------------------------------
 * CREATE USER
 * --------------------------------
 */
export const createUser = async (payload: any): Promise<User> => {
  const formData = new FormData();

  const { confirm_password, file, ...rest } = payload;

  appendPayloadToFormData(formData, rest);

  if (file instanceof File) {
    formData.append("file", file);
  }

  const response = await api.post("/users", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data.data;
};

/**
 * --------------------------------
 * UPDATE USER
 * --------------------------------
 */
export const updateUser = async (id: string, payload: any): Promise<User> => {
  const formData = new FormData();

  const { file, ...rest } = payload;

  appendPayloadToFormData(formData, rest);

  if (file instanceof File) {
    formData.append("file", file);
  }

  const response = await api.put(`/users/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data.data;
};

/**
 * --------------------------------
 * DELETE USER
 * --------------------------------
 */
export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/users/${id}`);
};
