import api from "@/lib/axios";

/**
 * --------------------------------
 * Types
 * --------------------------------
 */

export interface PermissionSettingPayload {
  settings_id: string;
  permission_type: string;
  user_ids: string[];
}

export interface PermissionUser {
  id: string;
  full_name: string;
  email: string;
}

export interface PermissionSetting {
  id: string;
  settings_id: string;
  permission_type: string;
  user_ids: string[];

  users?: PermissionUser[];

  created_by: string | null;
  updated_by: string | null;

  created_at: string;
  updated_at: string;
}

/**
 * --------------------------------
 * GET ALL
 * --------------------------------
 */
export const getPermissionSettings = async (): Promise<PermissionSetting[]> => {
  const response = await api.get("/permission-sett");
  const res = response.data;

  return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
};

/**
 * --------------------------------
 * GET BY ID
 * --------------------------------
 */
export const getPermissionSettingById = async (
  id: string,
): Promise<PermissionSetting> => {
  const response = await api.get(`/permission-sett/${id}`);
  return response.data.data;
};

/**
 * --------------------------------
 * CREATE
 * --------------------------------
 */
export const createPermissionSetting = async (
  payload: PermissionSettingPayload,
): Promise<PermissionSetting> => {
  const response = await api.post("/permission-sett", payload);
  return response.data.data;
};

/**
 * --------------------------------
 * UPDATE
 * --------------------------------
 */
export const updatePermissionSetting = async (
  id: string,
  payload: Partial<PermissionSettingPayload>,
): Promise<PermissionSetting> => {
  const response = await api.put(`/permission-sett/${id}`, payload);
  return response.data.data;
};

/**
 * --------------------------------
 * DELETE
 * --------------------------------
 */
export const deletePermissionSetting = async (id: string): Promise<void> => {
  await api.delete(`/permission-sett/${id}`);
};
