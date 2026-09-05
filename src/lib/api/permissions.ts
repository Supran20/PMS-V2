import api from "@/lib/axios";

/**
 * --------------------------------
 * Types
 * --------------------------------
 */

export interface Permission {
  id: string;
  permission_type: string; // e.g. "users.view" (resource.action naming from seeder)
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * --------------------------------
 * GET ALL PERMISSIONS
 * --------------------------------
 */
export const getPermissions = async (): Promise<Permission[]> => {
  const response = await api.get("/permissions");
  const res = response.data;
  return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
};
