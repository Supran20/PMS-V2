import { z } from "zod";

/**
 * --------------------------------
 * Base Schema (NO refine here)
 * --------------------------------
 */
const baseUserSchema = z.object({
  full_name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  status: z.enum(["active", "inactive"]).optional(),
  profile_image: z.string().url().optional(),
  mobile_number: z.string().optional(),
  enable_otp_login: z.boolean().optional(),
  otp_in_mail: z.boolean().optional(),
  otp_in_sms: z.boolean().optional(),
  role_name: z.enum(["Admin", "Host", "Staff"]),
});

/**
 * --------------------------------
 * Create Schema (with refine)
 * --------------------------------
 */
export const createUserSchema = baseUserSchema.refine(
  (data) => {
    if (!data.enable_otp_login) return true;
    return (
      (data.otp_in_mail && !data.otp_in_sms) ||
      (!data.otp_in_mail && data.otp_in_sms)
    );
  },
  {
    message: "Select exactly one OTP method (Email or SMS)",
    path: ["otp_in_mail"],
  },
);

export type CreateUserInput = z.infer<typeof createUserSchema>;

/**
 * --------------------------------
 * Update Schema
 * --------------------------------
 */
export const updateUserSchema = baseUserSchema
  .extend({
    password: z
      .string()
      .optional()
      .refine(
        (val) => !val || val.length >= 8,
        "Password must be at least 8 characters",
      ),
  })
  .refine(
    (data) => {
      if (!data.enable_otp_login) return true;
      return (
        (data.otp_in_mail && !data.otp_in_sms) ||
        (!data.otp_in_mail && data.otp_in_sms)
      );
    },
    {
      message: "Select exactly one OTP method (Email or SMS)",
      path: ["otp_in_mail"],
    },
  );

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
