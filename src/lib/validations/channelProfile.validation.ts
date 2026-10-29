import { z } from "zod";
import type {
  ChannelProfile,
  UpdateChannelProfilePayload,
} from "@/lib/api/channelProfile";

export const LOGO_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const LOGO_MAX_BYTES = 2 * 1024 * 1024; // 2 MB

const isHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const optionalUrl = z
  .string()
  .trim()
  .max(300, "Link is too long")
  .refine(
    (value) => value === "" || isHttpUrl(value),
    "Enter a valid link starting with http:// or https://",
  );

export const channelProfileFormSchema = z.object({
  channel_name: z
    .string()
    .trim()
    .min(2, "Channel name must be at least 2 characters")
    .max(100, "Channel name must be 100 characters or less"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be 500 characters or less"),
  youtube: optionalUrl,
  spotify: optionalUrl,
  instagram: optionalUrl,
  website: optionalUrl,
});

export type ChannelProfileFormInput = z.infer<typeof channelProfileFormSchema>;

export const toChannelProfileFormValues = (
  profile: ChannelProfile,
): ChannelProfileFormInput => ({
  channel_name: profile.channel_name,
  description: profile.description ?? "",
  youtube: profile.social_links?.youtube ?? "",
  spotify: profile.social_links?.spotify ?? "",
  instagram: profile.social_links?.instagram ?? "",
  website: profile.social_links?.website ?? "",
});

export const toUpdateChannelProfilePayload = (
  data: ChannelProfileFormInput,
): UpdateChannelProfilePayload => ({
  channel_name: data.channel_name,
  description: data.description,
  social_links: {
    youtube: data.youtube,
    spotify: data.spotify,
    instagram: data.instagram,
    website: data.website,
  },
});
