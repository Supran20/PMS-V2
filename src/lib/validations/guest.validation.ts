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
  full_name: z.string().min(1, "Guest name is required"),
  designation: z.string().optional().nullable(),
  slug: z.string().min(1, "Slug is required"),
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
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  status: z
    .enum(["not_started", "contacted", "follow_up", "confirmed"])
    .optional(),

  record: z.boolean().default(false),

  referred_by: z.string().uuid().optional().nullable(),
  notes: z.array(notesSchema).optional().nullable(),

  host_id: z.string().uuid().optional().nullable(),

  tag_id: z.string().uuid().optional().nullable(),
  file: z.any().optional(),
});

export type CreateGuestInput = z.infer<typeof createGuestSchema>;

/**
 * --------------------------------
 * UPDATE GUEST VALIDATION
 * --------------------------------
 */
export const updateGuestSchema = createGuestSchema.partial();

export type UpdateGuestInput = z.infer<typeof updateGuestSchema>;
