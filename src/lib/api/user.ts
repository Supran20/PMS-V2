import api from "@/lib/axios";
import { formatDateForFormData } from "@/lib/date-utils";

/**
 * --------------------------------
 * Types
 * --------------------------------
 */

export type VisibilityMode = "default" | "range" | "all";

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

  visibility_mode?: VisibilityMode;
  visibility_start_date?: Date | string | null;
  visibility_end_date?: Date | string | null;
  hide_guest_contacts?: boolean;
  role_name?: "Admin" | "Host" | "Staff";
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

  visibility_mode?: VisibilityMode;
  visibility_start_date?: string | null;
  visibility_end_date?: string | null;
  hide_guest_contacts?: boolean;

  roles?: {
    id: string;
    role_name: string;
  }[];
  created_at: string;
  updated_at: string;
}

/**
 * --------------------------------
 * FormData serialization helpers
 * --------------------------------
 * FormData can only carry strings, so a JS `null` and a JS `undefined`
 * both risk collapsing into the same (wrong) thing if handled naively:
 *   - String(null)      -> "null"      (a literal string, not cleared)
 *   - String(undefined) -> "undefined" (also wrong, and shouldn't even
 *                                        be sent — means "untouched")
 * These helpers keep the three states distinct:
 *   - undefined -> omit the key entirely ("don't touch this field")
 *   - null      -> send the "null" sentinel ("explicitly clear this")
 *   - Date      -> send as YYYY-MM-DD
 */

// Visibility fields need the sentinel-aware treatment above; every other
// field just gets skipped if undefined, and stringified otherwise. Nulls
// on non-visibility fields are treated as "don't send" — there's no
// other field today that needs an explicit-null-clear semantic.
const VISIBILITY_KEYS = new Set([
  "visibility_mode",
  "visibility_start_date",
  "visibility_end_date",
]);

function appendPayloadToFormData(
  formData: FormData,
  payload: Record<string, any>,
  { allowNullDateClear }: { allowNullDateClear: boolean },
) {
  Object.entries(payload).forEach(([key, value]) => {
    if (VISIBILITY_KEYS.has(key)) {
      if (key === "visibility_mode") {
        if (value === undefined) return;
        formData.append(key, String(value));
        return;
      }

      // visibility_start_date / visibility_end_date
      const formatted = formatDateForFormData(value, {
        allowNull: allowNullDateClear,
      });

      if (formatted === undefined) return;
      formData.append(key, formatted);
      return;
    }

    if (value === undefined || value === null) return;
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
 * Create never needs the null-clear sentinel — there's nothing to
 * revoke yet on a brand-new user, so visibility_start_date/end_date are
 * either a real date (range mode) or simply omitted (default/all mode).
 */
export const createUser = async (payload: any): Promise<User> => {
  const formData = new FormData();

  const { confirm_password, file, ...rest } = payload;

  appendPayloadToFormData(formData, rest, { allowNullDateClear: false });

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
 * Update DOES need the null-clear sentinel — this is how an Admin
 * revokes a previously granted window by switching back to
 * default/all mode. visibility_start_date/end_date sent as JS `null`
 * in the payload get serialized as the "null" sentinel string, which
 * the backend's nullableDateField preprocessing converts back to a
 * real null.
 */
export const updateUser = async (id: string, payload: any): Promise<User> => {
  const formData = new FormData();

  const { file, ...rest } = payload;

  appendPayloadToFormData(formData, rest, { allowNullDateClear: true });

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
