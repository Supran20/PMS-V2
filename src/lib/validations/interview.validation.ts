import { z } from "zod";

/**
 * Time format: HH:mm or HH:mm:ss (24-hour)
 */
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

/**
 * --------------------------------
 * CREATE INTERVIEW
 * --------------------------------
 */
export const createInterviewSchema = z.object({
  guest_id: z.string().uuid("Invalid guest ID"),
  host_id: z.string().uuid("Invalid host ID"),
  studio_id: z.string().uuid("Invalid studio ID"),

  episode: z.coerce.number().min(1, "Episode must be at least 1"),

  interview_date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid interview date",
    })
    .optional()
    .nullable(),

  start_time: z
    .string()
    .regex(timeRegex, "Invalid start time format")
    .optional()
    .nullable(),

  end_time: z
    .string()
    .regex(timeRegex, "Invalid end time format")
    .optional()
    .nullable(),

  interview_status: z
    .enum(["scheduled", "completed", "cancelled", "postponed"])
    .optional(),

  live_status: z.enum(["live", "recorded", "not_live"]).optional(),

  status: z
    .enum([
      "scheduled",
      "postponed",
      "cancelled",
      "recorded",
      "editing",
      "post_editing",
      "published",
    ])
    .optional(),

  google_drive_link: z.string().url("Invalid URL").optional().nullable(),
  youtube_link: z
    .string()
    .url("Invalid YouTube URL")
    .refine(
      (val) =>
        val.includes("youtube.com/embed/") ||
        val.includes("youtube.com/watch") ||
        val.includes("youtu.be/"),
      "Invalid YouTube link",
    )
    .optional()
    .nullable(),
});

export type CreateInterviewInput = z.input<typeof createInterviewSchema>;
export type CreateInterviewOutput = z.output<typeof createInterviewSchema>;

/**
 * --------------------------------
 * UPDATE INTERVIEW
 * --------------------------------
 */
export const updateInterviewSchema = createInterviewSchema.partial();

export type UpdateInterviewInput = z.input<typeof updateInterviewSchema>;
export type UpdateInterviewOutput = z.output<typeof updateInterviewSchema>;
