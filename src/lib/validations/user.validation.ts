import { z } from "zod";

/**
 * --------------------------------
 * Base Schema
 * --------------------------------
 */
const baseUserSchema = z.object({
  full_name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  confirm_password: z.string().min(8),
  status: z.enum(["active", "inactive"]).optional(),

  mobile_number: z.string().optional(),
  enable_otp_login: z.coerce.boolean().optional(),
  otp_in_mail: z.coerce.boolean().optional(),
  otp_in_sms: z.coerce.boolean().optional(),
  role_name: z.enum(["Admin", "Host", "Staff"]),
  file: z.any().optional(),
});

/**
 * --------------------------------
 * Create Schema
 * --------------------------------
 */
export const createUserSchema = baseUserSchema
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
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

export type CreateUserInput = z.infer<typeof createUserSchema>;

/**
 * --------------------------------
 * Update Schema
 * --------------------------------
 */
export const updateUserSchema = z
  .object({
    full_name: z.string().min(3).optional(),
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
    confirm_password: z.string().optional(),
    status: z.enum(["active", "inactive"]).optional(),

    mobile_number: z.string().optional(),
    enable_otp_login: z.coerce.boolean().optional(),
    otp_in_mail: z.coerce.boolean().optional(),
    otp_in_sms: z.coerce.boolean().optional(),
    role_name: z.enum(["Admin", "Host", "Staff"]).optional(),
    file: z.any().optional(),
  })
  .refine(
    (data) => {
      if (!data.password && !data.confirm_password) return true;
      return data.password === data.confirm_password;
    },
    {
      message: "Passwords do not match",
      path: ["confirm_password"],
    },
  )
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
