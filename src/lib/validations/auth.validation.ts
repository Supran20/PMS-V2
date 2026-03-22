import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "OTP must be a 6-digit number"),
  rememberMe: z.boolean().optional(),
});

export type OTPFormValues = z.infer<typeof otpSchema>;
