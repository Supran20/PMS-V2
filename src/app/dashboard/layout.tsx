"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { logout } from "@/lib/api/auth";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import Image from "next/image";

const INTERVIEW_STATUS_MENU = [
  { label: "All", value: "" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Recorded", value: "recorded" },
  { label: "Edited", value: "editing" },
  { label: "Post Editing", value: "post_editing" },
  { label: "Published", value: "published" },
  { label: "Postponed", value: "postponed" },
  { label: "Cancelled", value: "cancelled" },
];

const SIDEBAR_TABS = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: "mdi:view-dashboard",
  },

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
  const { user, loading, hasPermission } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = React.useState(true);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement | null>(null);
  const [interviewMenuOpen, setInterviewMenuOpen] = React.useState(false);

  // Protect route
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const displayName = user?.full_name || user?.email || "User";

  const handleLogout = () => logout();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex-shrink-0 bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
          isSidebarOpen ? "w-64" : "w-25",
        )}
      >
        {/* Logo & Toggle */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/rst.png"
              alt="RST"
              width={isSidebarOpen ? 110 : 50}
              height={50}
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {SIDEBAR_TABS.map((tab) => {
              const isInterview = tab.href === "/dashboard/interview";

              if (isInterview) {
                return (
                  <li key={tab.href} className="relative">
                    <button
                      onClick={() => setInterviewMenuOpen((prev) => !prev)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 w-full"
                    >
                      <Icon icon={tab.icon} className="text-xl flex-shrink-0" />

                      <span
                        className={cn(
                          "transition-opacity duration-300",
                          !isSidebarOpen && "opacity-0 overflow-hidden",
                        )}
                      >
                        {tab.label}
                      </span>

                      <Icon
                        icon="mdi:chevron-down"
                        className="ml-auto text-gray-400"
                      />
                    </button>

                    {interviewMenuOpen && (
                      <ul
                        className={cn(
                          "ml-8 mt-1 space-y-1 ",
                          !isSidebarOpen && "ml-0 ",
                        )}
                      >
                        {INTERVIEW_STATUS_MENU.map((item) => (
                          <li key={item.label}>
                            <Link
                              href={
                                item.value
                                  ? `/dashboard/interview?status=${item.value}`
                                  : `/dashboard/interview`
                              }
                              className={cn(
                                "block px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md",
                                !isSidebarOpen && "text-vxs",
                              )}
                            >
                              {item.label}
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
                  : pathname === tab.href ||
                    pathname.startsWith(tab.href + "/");

              return (
                <li key={tab.href}>
                  <Link
                    href={tab.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-red-50 text-red-700"
                        : "text-gray-700 hover:bg-gray-100",
                    )}
                  >
                    <Icon icon={tab.icon} className="text-xl flex-shrink-0" />

                    <span
                      className={cn(
                        "transition-opacity duration-300",
                        !isSidebarOpen && "opacity-0 overflow-hidden",
                      )}
                    >
                      {tab.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-10 flex-shrink-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-md hover:bg-gray-200 cursor-pointer"
            >
              <Icon icon="mdi:menu" className="text-xl" />
            </button>
            <h1 className="text-lg font-semibold text-gray-800">
              Podcast Management
            </h1>
          </div>

          <div className="flex items-center gap-4 relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition cursor-pointer"
            >
              <Icon
                icon="mdi:account-circle"
                className="text-2xl text-gray-600"
              />
              <span className="text-sm font-medium text-gray-800">
                {displayName}
              </span>
              <Icon icon="mdi:chevron-down" className="text-gray-500" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-12 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                {hasPermission("user.manage") && (
                  <Link
                    href="/dashboard/users"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Icon icon="mdi:account-group" className="text-lg" />
                    Users
                  </Link>
                )}

                <Link
                  href="/dashboard/studio"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Icon icon="mdi:microphone" className="text-lg" />
                  Studio
                </Link>

                <Link
                  href="/dashboard/media"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Icon icon="mdi:video" className="text-lg" />
                  Media
                </Link>

                <Link
                  href="/dashboard/tags"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Icon icon="mdi:tag-multiple" className="text-lg" />
                  Tags
                </Link>

                <div className="border-t my-1" />

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Icon icon="mdi:logout" className="text-lg" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
