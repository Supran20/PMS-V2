"use client";

import React from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { ChannelBrand } from "@/components/channels/ChannelBrand";
import { SidebarNav } from "./SidebarNav";
import { SidebarTab } from "./sidebarConfig";

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  tabs: SidebarTab[];
  isPlatformArea: boolean;
  statusCounts: Record<string, number>;
}

export function MobileDrawer({
  open,
  onClose,
  tabs,
  isPlatformArea,
  statusCounts,
}: MobileDrawerProps) {
  return (
    <>
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-50 z-999 bg-white shadow-lg md:hidden transform transition-transform duration-300",
          open ? "-translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="absolute right-4 top-4">
          <button
            onClick={onClose}
            className=" rounded-full text-xl  flex items-center justify-center"
          >
            <Icon icon="uil:multiply" />
          </button>
        </div>

        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <ChannelBrand platform={isPlatformArea} />
          </Link>
        </div>

        <SidebarNav
          tabs={tabs}
          statusCounts={statusCounts}
          onNavigate={onClose}
        />
      </aside>

      {open && (
        <div onClick={onClose} className="fixed inset-0 bg-black/25"></div>
      )}
    </>
  );
}
