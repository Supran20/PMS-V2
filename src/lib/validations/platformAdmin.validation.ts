import { z } from "zod";

/**
 * --------------------------------
 * Create Schema
 * --------------------------------
 * Note: status / OTP fields are intentionally NOT included here — the
 * backend's PlatformAdminService.createPlatformAdmin() ignores them even
 * though createPlatformAdminSchema (backend) technically accepts them.
 * Every platform admin's underlying User is always created active, with
 * OTP login off, in the Default Channel.
 */
export const createPlatformAdminSchema = z
  .object({
    full_name: z.string().min(3, "Full name must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z
      .string()
      .min(8, "Confirm password must be at least 8 characters"),

    mobile_number: z
      .string()
      .regex(/^\+?[1-9]\d{7,14}$/, "Invalid phone number")
      .optional()
      .or(z.literal("")),

    file: z.custom<File>().optional(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type CreatePlatformAdminInput = z.infer<
  typeof createPlatformAdminSchema
>;
