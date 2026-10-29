import api from "@/lib/axios";
import type { Media } from "@/context/AuthContext";

export interface ChannelSocialLinks {
  youtube?: string | null;
  spotify?: string | null;
  instagram?: string | null;
  website?: string | null;
}

export interface ChannelProfile {
  id: string;
  channel_name: string;
  slug: string;
  description: string | null;
  social_links: ChannelSocialLinks;
  logo: Media | null;
}

export interface UpdateChannelProfilePayload {
  channel_name: string;
  // "" clears a field on the backend
  description: string;
  social_links: {
    youtube: string;
    spotify: string;
    instagram: string;
    website: string;
  };
}

const BASE_PATH = "/channel/me";

export const getMyChannel = async (): Promise<ChannelProfile> => {
  const response = await api.get(BASE_PATH);
  return response.data.data;
};

export const updateMyChannel = async (
  payload: UpdateChannelProfilePayload,
): Promise<ChannelProfile> => {
  const response = await api.put(BASE_PATH, payload);
  return response.data.data;
};

export const uploadMyChannelLogo = async (
  file: File,
): Promise<ChannelProfile> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.put(`${BASE_PATH}/logo`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
};

export const removeMyChannelLogo = async (): Promise<ChannelProfile> => {
  const response = await api.delete(`${BASE_PATH}/logo`);
  return response.data.data;
};
