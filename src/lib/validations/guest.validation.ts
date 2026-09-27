import { z } from "zod";

/**
 * --------------------------------
 * CREATE GUEST VALIDATION
 * --------------------------------
 */

const optionalUrl = z.string().url().optional().or(z.literal(""));

export const notesSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
});

export const createGuestSchema = z.object({
  full_name: z
    .string({ error: "Guest name is required" })
    .trim()
    .min(1, "Guest name is required"),

  designation: z.string().optional().nullable(),

  bio: z.string().optional().nullable(),

  social_media: z
    .object({
      linkedin: optionalUrl,
      facebook: optionalUrl,
      github: optionalUrl,
      instagram: optionalUrl,
    })
    .optional()
    .nullable(),

  email: z.string().email("Invalid email address").optional().nullable(),

  phone: z
    .string({ error: "Phone number is required" })
    .trim()
    .min(1, "Phone number is required")
    .regex(/^\+?[0-9\s\-()]{7,20}$/, "Invalid phone number format"),

  status: z
    .enum(["not_started", "contacted", "follow_up", "confirmed"])
    .optional(),

  record: z.boolean().default(false),

  referred_by: z.string().uuid().optional().nullable(),

  notes: z.array(notesSchema).optional().nullable(),

  tag_ids: z.array(z.string()).optional().nullable(),

  host_id: z.string().uuid().optional().nullable(),

  file: z.any().optional(),
});

export type CreateGuestInput = z.infer<typeof createGuestSchema>;

/**
 * --------------------------------
 * UPDATE GUEST VALIDATION
 * --------------------------------
 */

export const updateGuestSchema = createGuestSchema.partial().extend({
  phone: z
    .string({ error: "Phone number is required" })
    .trim()
    .min(1, "Phone number is required")
    .regex(/^\+?[0-9\s\-()]{7,20}$/, "Invalid phone number format"),
});

export type UpdateGuestInput = z.infer<typeof updateGuestSchema>;
