import { z } from "zod";

export const createUserSchema = z.object({
  full_name: z.string().min(3),
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  status: z.enum(["active", "inactive"]).optional(),
  profile_image: z.string().url().optional(),
  mobile_number: z.string().optional(),
  enable_otp_login: z.boolean().optional(),
  role_name: z.enum(["Admin", "Host", "Staff"]),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = createUserSchema.extend({
  password: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length >= 8,
      "Password must be at least 8 characters",
    ),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
