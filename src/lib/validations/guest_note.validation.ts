import { z } from "zod";

/**
 * --------------------------------
 * CREATE NOTE
 * --------------------------------
 */

export const createGuestNoteSchema = z.object({
  guest_id: z.string().uuid(),

  title: z.string().min(1, "Title is required").max(200, "Title too long"),

  description: z
    .string()
    .max(2000, "Description too long")
    .optional()
    .nullable(),
});

export type CreateGuestNoteInput = z.infer<typeof createGuestNoteSchema>;

/**
 * --------------------------------
 * UPDATE NOTE
 * --------------------------------
 */

export const updateGuestNoteSchema = createGuestNoteSchema.partial();

export type UpdateGuestNoteInput = z.infer<typeof updateGuestNoteSchema>;
