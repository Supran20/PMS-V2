"use client";

import React from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { DEFAULT_CHANNEL_SLUG } from "@/lib/api/channel";
import { getInitials, getMediaUrl } from "@/lib/utils";

interface ChannelBrandProps {
  /** Icon-only layout (collapsed sidebar, mobile header). */
  collapsed?: boolean;
  /** Platform area keeps the platform logo. */
  platform?: boolean;
}

export function ChannelBrand({
  collapsed = false,
  platform = false,
}: ChannelBrandProps) {
  const { user } = useAuth();
  const channel = user?.channel;

  const usePlatformLogo =
    platform ||
    !channel ||
    (!channel.logo && channel.slug === DEFAULT_CHANNEL_SLUG);

  if (usePlatformLogo) {
    return (
      <Image
        src="/rst.png"
        alt="RST"
        width={collapsed ? 50 : 110}
        height={50}
      />
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-sm font-semibold text-gray-600">
        {channel.logo?.path ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={getMediaUrl(channel.logo.path)}
            alt={channel.channel_name}
            className="h-full w-full object-contain"
          />
        ) : (
          getInitials(channel.channel_name)
        )}
      </div>

      {!collapsed && (
        <span className="truncate text-sm font-semibold text-gray-800">
          {channel.channel_name}
        </span>
      )}
    </div>
  );
}
