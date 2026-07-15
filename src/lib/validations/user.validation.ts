import { z } from "zod";

/**
 * --------------------------------
 * Base Schema
 * --------------------------------
 */

const dateField = z.preprocess((value) => {
  if (value === "" || value === undefined) return undefined;
  return value;
}, z.coerce.date());

const visibilityModeEnum = z.enum(["default", "range", "all"]);

const baseUserSchema = z.object({
  full_name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  confirm_password: z.string().min(8),
  status: z.enum(["active", "inactive"]).optional(),

  mobile_number: z.string().optional(),

  enable_otp_login: z.boolean().optional(),
  otp_in_mail: z.boolean().optional(),
  otp_in_sms: z.boolean().optional(),

  visibility_mode: visibilityModeEnum.optional(),
  visibility_start_date: dateField.optional(),
  visibility_end_date: dateField.optional(),

  role_name: z.enum(["Admin", "Host", "Staff"]),
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
  )
  .superRefine((data, ctx) => {
    const {
      visibility_mode: mode,
      visibility_start_date: start,
      visibility_end_date: end,
    } = data;

    const touchingVisibility =
      mode !== undefined || start !== undefined || end !== undefined;

    if (!touchingVisibility) return;

    if (data.role_name === "Admin") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["visibility_mode"],
        message: "Visibility settings are not allowed for Admin users.",
      });
      return;
    }

    const effectiveMode = mode ?? "default";

    if (effectiveMode === "default" || effectiveMode === "all") {
      if (start !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["visibility_start_date"],
          message: `visibility_start_date is not allowed in "${effectiveMode}" mode.`,
        });
      }
      if (end !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["visibility_end_date"],
          message: `visibility_end_date is not allowed in "${effectiveMode}" mode.`,
        });
      }
      return;
    }

    // effectiveMode === "range"
    if (!start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["visibility_start_date"],
        message: "visibility_start_date is required in range mode.",
      });
      return;
    }

    if (end !== undefined) {
      if (end < start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["visibility_end_date"],
          message:
            "visibility_end_date must be greater than or equal to visibility_start_date.",
        });
      }

      if (end > new Date()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["visibility_end_date"],
          message: "visibility_end_date cannot be in the future.",
        });
      }
    }
  });

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
    enable_otp_login: z.boolean().optional(),
    otp_in_mail: z.boolean().optional(),
    otp_in_sms: z.boolean().optional(),

    visibility_mode: visibilityModeEnum.optional(),
    visibility_start_date: dateField.nullable().optional(),
    visibility_end_date: dateField.nullable().optional(),

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
  )
  .superRefine((data, ctx) => {
    const {
      visibility_mode: mode,
      visibility_start_date: start,
      visibility_end_date: end,
    } = data;

    const touchingVisibility =
      mode !== undefined || start !== undefined || end !== undefined;

    if (!touchingVisibility) return;

    if (data.role_name === "Admin") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["visibility_mode"],
        message: "Visibility settings are not allowed for Admin users.",
      });
      return;
    }

    const effectiveMode = mode ?? "default";

    if (effectiveMode === "default" || effectiveMode === "all") {
      if (start !== undefined && start !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["visibility_start_date"],
          message: `visibility_start_date is not allowed in "${effectiveMode}" mode.`,
        });
      }
      if (end !== undefined && end !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["visibility_end_date"],
          message: `visibility_end_date is not allowed in "${effectiveMode}" mode.`,
        });
      }
      return;
    }

    // effectiveMode === "range"
    if (!start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["visibility_start_date"],
        message: "visibility_start_date is required in range mode.",
      });
      return;
    }

    if (start instanceof Date && end instanceof Date) {
      if (end < start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["visibility_end_date"],
          message:
            "visibility_end_date must be greater than or equal to visibility_start_date.",
        });
      }

      if (end > new Date()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["visibility_end_date"],
          message: "visibility_end_date cannot be in the future.",
        });
      }
    }
  });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
