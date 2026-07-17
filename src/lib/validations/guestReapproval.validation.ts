import { z } from "zod";

/**
 * --------------------------------
 * CREATE REAPPROVAL REQUEST VALIDATION
 * --------------------------------
 * Mirrors the backend's createGuestReapprovalRequestSchema. Used to
 * validate the payload assembled by the duplicate-guest modal before
 * it's sent — there's no free-text user input here, but keeping the
 * shape validated guards against a bad guestId/hostId slipping through
 * from stale component state.
 */
export const createReapprovalRequestSchema = z.object({
  guest_id: z.string().uuid(),

  proposed_host_id: z.string().uuid().optional().nullable(),

  interview_id: z.string().uuid().optional().nullable(),

  trigger_source: z.enum(["duplicate_guest_attempt", "repeat_booking"]),
});

export type CreateReapprovalRequestInput = z.infer<
  typeof createReapprovalRequestSchema
>;

/**
 * --------------------------------
 * REVIEW (APPROVE / REJECT) VALIDATION
 * --------------------------------
 * Backs the optional review-note textarea in the approve/reject dialog
 * on the reapproval-requests management page.
 */
export const reviewReapprovalRequestSchema = z.object({
  review_note: z
    .string()
    .trim()
    .max(1000, "Note is too long")
    .optional()
    .nullable(),
});

export type ReviewReapprovalRequestInput = z.infer<
  typeof reviewReapprovalRequestSchema
>;
