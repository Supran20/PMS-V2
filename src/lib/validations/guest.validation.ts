import { z } from "zod";

/**
 * --------------------------------
 * CREATE GUEST VALIDATION
 * --------------------------------
 */
const optionalUrl = z.preprocess(
  (val) => (val === "" ? undefined : val),
  z.string().url().optional(),
);

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

  profile_image: z.string().uuid().optional().nullable(),
  referred_by: z.string().uuid().optional().nullable(),
});

export type CreateGuestInput = z.infer<typeof createGuestSchema>;

/**
 * --------------------------------
 * UPDATE GUEST VALIDATION
 * --------------------------------
 */
export const updateGuestSchema = createGuestSchema.partial();

export type UpdateGuestInput = z.infer<typeof updateGuestSchema>;
