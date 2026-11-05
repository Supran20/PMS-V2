"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
  INTERVIEW_STATUS_MENU,
  INTERVIEW_TAB_HREF,
  SidebarTab,
} from "./sidebarConfig";

interface SidebarNavProps {
  tabs: SidebarTab[];
  /** Icon-only layout (collapsed desktop sidebar). */
  collapsed?: boolean;
  statusCounts: Record<string, number>;
  /** Called when a link is clicked (the mobile drawer uses it to close). */
  onNavigate?: () => void;
}

export function SidebarNav({
  tabs,
  collapsed = false,
  statusCounts,
  onNavigate,
}: SidebarNavProps) {
  const pathname = usePathname();
  const { hasPermission } = useAuth();
  const [interviewMenuOpen, setInterviewMenuOpen] = useState(false);

  const labelClass = cn(
    "transition-opacity duration-300",
    collapsed && "opacity-0 overflow-hidden",
  );

  return (
    <nav className="flex-1 overflow-y-auto py-4 px-3">
      <ul className="space-y-1">
        {tabs.map((tab) => {
          if (tab.permission && !hasPermission(tab.permission)) {
            return null;
          }

          if (tab.href === INTERVIEW_TAB_HREF) {
            return (
              <li key={tab.href} className="relative">
                <button
                  onClick={() => setInterviewMenuOpen((prev) => !prev)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 w-full"
                >
                  <Icon icon={tab.icon} className="text-xl flex-shrink-0" />
                  <span className={labelClass}>{tab.label}</span>
                  <Icon
                    icon="mdi:chevron-down"
                    className="ml-auto text-gray-400"
                  />
                </button>

                {interviewMenuOpen && (
                  <ul
                    className={cn("ml-8 mt-1 space-y-1 ", collapsed && "ml-0 ")}
                  >
                    {INTERVIEW_STATUS_MENU.map((item) => (
                      <li key={item.label}>
                        <Link
                          href={
                            item.value
                              ? `${INTERVIEW_TAB_HREF}?status=${item.value}`
                              : INTERVIEW_TAB_HREF
                          }
                          onClick={onNavigate}
                          className={cn(
                            "block px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md",
                            collapsed && "text-vxs",
                          )}
                        >
                          {item.label} ({statusCounts[item.value] || 0})
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          }

          const isActive =
            tab.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === tab.href || pathname.startsWith(tab.href + "/");

          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-red-50 text-red-700"
                    : "text-gray-700 hover:bg-gray-100",
                )}
              >
                <Icon icon={tab.icon} className="text-xl flex-shrink-0" />
                <span className={labelClass}>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
