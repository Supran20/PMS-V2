"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { logout } from "@/lib/api/auth";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import Image from "next/image";

const SIDEBAR_TABS = [
  { label: "Overview", href: "/dashboard", icon: "mdi:view-dashboard" },
  { label: "Users", href: "/dashboard/users", icon: "mdi:account-group" },
  { label: "Media", href: "/dashboard/media", icon: "mdi:video" },
  { label: "Tags", href: "/dashboard/tags", icon: "mdi:tag-multiple" },
  { label: "Studio", href: "/dashboard/studio", icon: "mdi:microphone" },
  { label: "Guest", href: "/dashboard/guest", icon: "mdi:account-voice" },
  {
    label: "Interview",
    href: "/dashboard/interview",
    icon: "mdi:chat-question",
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  /* 🔐 PROTECT ROUTE */
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/"); // redirect to login
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const displayName = user?.full_name || user?.email || "User";

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/microphone.png"
              alt="AdhiZ"
              width={100}
              height={32}
              className="h-8 w-auto"
            />
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {SIDEBAR_TABS.map((tab) => {
              const isActive =
                tab.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname === tab.href ||
                    pathname.startsWith(tab.href + "/");
              return (
                <li key={tab.href}>
                  <Link
                    href={tab.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
                    )}
                  >
                    <Icon icon={tab.icon} className="text-xl flex-shrink-0" />
                    {tab.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky header */}
        <header className="sticky top-0 z-10 flex-shrink-0 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Podcast Management
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700">
              <Icon
                icon="mdi:account-circle"
                className="text-2xl text-gray-600 dark:text-gray-400"
              />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                {displayName}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Icon icon="mdi:logout" className="text-lg" />
              Logout
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
