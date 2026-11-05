"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useAuth } from "@/context/AuthContext";
import { logout } from "@/lib/api/auth";
import { getInitials, getMediaUrl } from "@/lib/utils";
import { useClickOutside } from "@/hooks/useClickOutside";

interface MenuItem {
  label: string;
  href: string;
  icon: string;
  permission?: string;
  platformAdminOnly?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  {
    label: "Platform Dashboard",
    href: "/dashboard/platform-admin/channels",
    icon: "mdi:shield-crown",
    platformAdminOnly: true,
  },
  {
    label: "Users",
    href: "/dashboard/users",
    icon: "mdi:account-group",
    permission: "users.view",
  },
  {
    label: "Studio",
    href: "/dashboard/studio",
    icon: "mdi:microphone",
    permission: "studio.view",
  },
  { label: "Media", href: "/dashboard/media", icon: "mdi:video" },
  {
    label: "Tags",
    href: "/dashboard/tags",
    icon: "mdi:tag-multiple",
    permission: "tags.view",
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: "mdi:cog-outline",
    permission: "settings.view",
  },
];

export function UserMenu() {
  const { user, hasPermission } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useClickOutside(menuRef, () => setOpen(false));

  if (!user) return null;

  const displayName = user.full_name || user.email || "User";

  const visibleItems = MENU_ITEMS.filter((item) => {
    if (item.platformAdminOnly) return user.is_platform_admin;
    return !item.permission || hasPermission(item.permission);
  });

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition cursor-pointer"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-gray-200 text-xs font-semibold text-gray-600">
          {user.profileImage?.path ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getMediaUrl(user.profileImage.path)}
              alt={user.full_name}
              className="w-full h-full object-cover"
            />
          ) : (
            getInitials(user.full_name)
          )}
        </div>
        <span className="text-sm font-medium text-gray-800">{displayName}</span>
        <Icon icon="mdi:chevron-down" className="text-gray-500" />
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Icon icon={item.icon} className="text-lg" />
              {item.label}
            </Link>
          ))}

          <div className="border-t my-1" />

          <button
            onClick={() => logout()}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Icon icon="mdi:logout" className="text-lg" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
