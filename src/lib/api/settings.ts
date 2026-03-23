import api from "@/lib/axios";

export interface SettingsPayload {
  type: string;
}

export interface Settings {
  id: string;
  type: string;
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
export const getSettings = async (): Promise<Settings[]> => {
  const response = await api.get("/settings");
  const res = response.data;

  return Array.isArray(res?.data) ? res.data : [];
};

/**
 * --------------------------------
 * GET BY TYPE
 * --------------------------------
 */
export const getSettingsByType = async (type: string): Promise<Settings> => {
  const response = await api.get(`/settings/type/${type}`);
  return response.data.data;
};
