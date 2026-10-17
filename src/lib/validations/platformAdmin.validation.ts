import { z } from "zod";

const mobileNumberSchema = z
  .string()
  .regex(/^\+?[1-9]\d{7,14}$/, "Invalid phone number")
  .optional()
  .or(z.literal(""));

type OtpRuleFields = {
  enable_otp_login?: boolean;
  otp_in_mail?: boolean;
  otp_in_sms?: boolean;
  mobile_number?: string;
};

// Mirrors the backend rules: exactly one OTP method, and SMS needs a number.
const refineOtpRules = (data: OtpRuleFields, ctx: z.RefinementCtx) => {
  if (!data.enable_otp_login) return;

  if (!!data.otp_in_mail === !!data.otp_in_sms) {
    ctx.addIssue({
      code: "custom",
      path: ["otp_in_mail"],
      message: "Select exactly one OTP method (Email or SMS)",
    });
  }

  if (data.otp_in_sms && !data.mobile_number) {
    ctx.addIssue({
      code: "custom",
      path: ["mobile_number"],
      message: "Mobile number is required for SMS OTP",
    });
  }
};

/**
 * --------------------------------
 * Create Schema
 * --------------------------------
 */
export const createPlatformAdminSchema = z
  .object({
    full_name: z.string().min(3, "Full name must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z
      .string()
      .min(8, "Confirm password must be at least 8 characters"),
    status: z.enum(["active", "inactive"]),
    mobile_number: mobileNumberSchema,
    enable_otp_login: z.boolean().optional(),
    otp_in_mail: z.boolean().optional(),
    otp_in_sms: z.boolean().optional(),
    file: z.custom<File>().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirm_password) {
      ctx.addIssue({
        code: "custom",
        path: ["confirm_password"],
        message: "Passwords do not match",
      });
    }
    refineOtpRules(data, ctx);
  });

export type CreatePlatformAdminInput = z.infer<
  typeof createPlatformAdminSchema
>;

/**
 * --------------------------------
 * Update Schema
 * --------------------------------
 * password is optional: blank means "keep the current password".
 * status is optional because it's omitted when editing your own account.
 */
export const updatePlatformAdminSchema = z
  .object({
    full_name: z.string().min(3, "Full name must be at least 3 characters"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .optional()
      .or(z.literal("")),
    confirm_password: z.string().optional(),
    status: z.enum(["active", "inactive"]).optional(),
    mobile_number: mobileNumberSchema,
    enable_otp_login: z.boolean().optional(),
    otp_in_mail: z.boolean().optional(),
    otp_in_sms: z.boolean().optional(),
    file: z.custom<File>().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.password && data.password !== data.confirm_password) {
      ctx.addIssue({
        code: "custom",
        path: ["confirm_password"],
        message: "Passwords do not match",
      });
    }
    refineOtpRules(data, ctx);
  });

export type UpdatePlatformAdminInput = z.infer<
  typeof updatePlatformAdminSchema
>;
