import { z } from "zod";

/**
 * --------------------------------
 * Base Schema
 * --------------------------------
 */
const baseUserSchema = z.object({
  full_name: z.string().min(3, "Full name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string().min(8, "Confirm password must be at least 8 characters"),
  status: z.enum(["active", "inactive"]).optional(),

  mobile_number: z
    .string()
    .regex(/^\+?[1-9]\d{7,14}$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),

  enable_otp_login: z.boolean().optional(),
  otp_in_mail: z.boolean().optional(),
  otp_in_sms: z.boolean().optional(),

  role_name: z.enum(["Admin", "Host", "Staff", "Super Admin"]),
  file: z.any().optional(),
});

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
      message: "Select exactly one OTP method",
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
    full_name: z.string().min(3, "Full name must be at least 3 characters").optional(),
    email: z.string().email("Invalid email address").optional(),
    password: z.string().min(8, "Password must be at least 8 characters").optional().or(z.literal("")),
    confirm_password: z.string().optional().or(z.literal("")),
    status: z.enum(["active", "inactive"]).optional(),

    mobile_number: z.string().optional(),
    enable_otp_login: z.boolean().optional(),
    otp_in_mail: z.boolean().optional(),
    otp_in_sms: z.boolean().optional(),

    role_name: z.enum(["Admin", "Host", "Staff", "Super Admin"]).optional(),
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

export const editUserFormSchema = updateUserSchema;
export type EditUserFormInput = UpdateUserInput;
