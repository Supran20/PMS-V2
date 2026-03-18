import { z } from "zod";

// UUID validation helper
const uuidSchema = z.string().uuid("Invalid UUID");

// CREATE
export const createPermissionSettingsSchema = z.object({
  settings_id: uuidSchema,
  permission_type: z.string().min(1, "Permission type is required"),
  user_ids: z.array(uuidSchema).min(1, "At least one user is required"),
});

// UPDATE
export const updatePermissionSettingsSchema = z.object({
  permission_type: z.string().optional(),
  user_ids: z.array(uuidSchema).optional(),
});
