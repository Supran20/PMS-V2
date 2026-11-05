"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { ChannelBrand } from "@/components/channels/ChannelBrand";
import { UserMenu } from "./UserMenu";

interface TopBarProps {
  pendingGuestCount: number;
  isPlatformArea: boolean;
  onToggleSidebar: () => void;
  onOpenDrawer: () => void;
}

export function TopBar({
  pendingGuestCount,
  isPlatformArea,
  onToggleSidebar,
  onOpenDrawer,
}: TopBarProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-10 flex-shrink-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="md:hidden block border-b border-gray-200 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <ChannelBrand collapsed platform={isPlatformArea} />
          </Link>
        </div>

        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-md md:block hidden hover:bg-gray-200 cursor-pointer"
        >
          <Icon icon="mdi:menu" className="text-xl" />
        </button>

        {/* offcanvas button toggle */}
        <button
          onClick={onOpenDrawer}
          className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Icon icon="mdi:menu" className="text-xl" />
        </button>

        <h1 className="text-lg  font-semibold text-gray-800 md:block hidden">
          Podcast Management
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {pendingGuestCount > 0 && (
          <button
            onClick={() => router.push("/dashboard/guest?tab=pending")}
            className="relative p-2 rounded-full cursor-pointer bg-red-50 hover:bg-red-100 transition"
            title="Pending Guests"
          >
            <Icon icon="mdi:account-voice" className="text-xl text-red-600" />
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {pendingGuestCount}
            </span>
          </button>
        )}

        <UserMenu />
      </div>
    </header>
  );
}
