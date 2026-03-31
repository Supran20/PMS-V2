import { z } from "zod";

export const createMediaSchema = z.object({
  media_name: z.string().min(1, "Media name is required"),
  tag_id: z.union([z.string().uuid(), z.literal("")]).optional(),
  file: z.instanceof(File, { message: "File is required" }),
});

export type CreateMediaInput = z.infer<typeof createMediaSchema>;

export const updateMediaSchema = z.object({
  media_name: z.string().min(1, "Media name is required"),
  tag_id: z
    .union([z.string().uuid(), z.literal("")])
    .nullable()
    .optional(),
  file: z.instanceof(File).optional(),
});

export type UpdateMediaInput = z.infer<typeof updateMediaSchema>;
