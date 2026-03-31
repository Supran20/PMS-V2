import { z } from "zod";

export const createTagSchema = z.object({
  tag_name: z.string().min(1, "Tag name is required"),
  slug: z.string().optional(),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;

export const updateTagSchema = z.object({
  tag_name: z.string().min(1, "Tag name is required").optional(),
  slug: z.string().optional(),
});

export type UpdateTagInput = z.infer<typeof updateTagSchema>;
