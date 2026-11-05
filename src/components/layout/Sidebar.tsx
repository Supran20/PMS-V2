"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChannelBrand } from "@/components/channels/ChannelBrand";
import { SidebarNav } from "./SidebarNav";
import { SidebarTab } from "./sidebarConfig";

interface SidebarProps {
  tabs: SidebarTab[];
  isOpen: boolean;
  isPlatformArea: boolean;
  statusCounts: Record<string, number>;
}

export function Sidebar({
  tabs,
  isOpen,
  isPlatformArea,
  statusCounts,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        " bg-white border-r hidden md:block border-gray-200 md:flex flex-col transition-all duration-300",
        isOpen ? "w-64" : "w-25",
      )}
    >
      <div className="p-5 border-b border-gray-200 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <ChannelBrand collapsed={!isOpen} platform={isPlatformArea} />
        </Link>
      </div>

      <SidebarNav tabs={tabs} collapsed={!isOpen} statusCounts={statusCounts} />
    </aside>
  );
}
