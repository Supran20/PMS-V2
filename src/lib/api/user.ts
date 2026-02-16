import api from "@/lib/axios";

/**
 * --------------------------------
 * Types
 * --------------------------------
 */

export interface UserPayload {
  full_name: string;
  username: string;
  email: string;
  password?: string;
  status?: "active" | "inactive";
  profile_image?: string;
  mobile_number?: string;
  enable_otp_login?: boolean;
  role_name?: "Admin" | "Host" | "Staff";
}

export interface User {
  id: string;
  full_name: string;
  username: string;
  email: string;
  status: string;
  profile_image?: string | null;
  mobile_number?: string | null;
  enable_otp_login?: boolean;
  roles?: {
    id: string;
    role_name: string;
  }[];
  created_at: string;
  updated_at: string;
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
 * CREATE USER
 * --------------------------------
 */
export const createUser = async (payload: UserPayload): Promise<User> => {
  const response = await api.post("/users", payload);
  return response.data.data;
};

/**
 * --------------------------------
 * UPDATE USER
 * --------------------------------
 */
export const updateUser = async (
  id: string,
  payload: Partial<UserPayload>
): Promise<User> => {
  const response = await api.put(`/users/${id}`, payload);
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
