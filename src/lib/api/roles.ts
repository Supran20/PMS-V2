import api from "@/lib/axios";
import { Permission } from "./permissions";

/**
 * --------------------------------
 * Types
 * --------------------------------
 */

export interface Role {
  id: string;
  role_name: string; // e.g. "Admin", "Host", "Staff", "Super Admin"
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

// NOTE: there is currently no `GET /roles` (list) endpoint on the backend —
// only `GET /roles/:id/permissions`. The role <select> needs a source of
// {id, role_name} pairs. See conversation note: add a lightweight
// `RoleService.getAllRoles()` + `GET /roles` route, mirroring
// `PermissionService.getAllPermissions()`, before wiring the dropdown.

/**
 * --------------------------------
 * GET ROLE DEFAULT PERMISSIONS
 * --------------------------------
 */
export const getRolePermissions = async (
  roleId: string,
): Promise<Permission[]> => {
  const response = await api.get(`/roles/${roleId}/permissions`);
  const res = response.data;
  return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
};

/**
 * --------------------------------
 * GET ALL ROLES
 * --------------------------------
 */
export const getRoles = async (): Promise<Role[]> => {
  const response = await api.get("/roles");
  const res = response.data;
  return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
};
