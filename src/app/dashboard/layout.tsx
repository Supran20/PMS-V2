"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { logout } from "@/lib/api/auth";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { getGuests, Guest } from "@/lib/api/guest";

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
  // const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [isSidebarOpen, setSidebarOpen] = React.useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement | null>(null);
  const [interviewMenuOpen, setInterviewMenuOpen] = React.useState(false);
  const mobileDrawerRef = React.useRef<HTMLDivElement | null>(null);
  const [offcanvasOpen, setOffcanvasOpen] = useState(false);
  const [pendingGuestCount, setPendingGuestCount] = React.useState<number>(0);

  // Fetch pending guests
  useEffect(() => {
    const fetchPendingGuests = async () => {
      try {
        const data: Guest[] = await getGuests();
        const pending = data.filter((g) => !g.approved && !g.rejected);
        setPendingGuestCount(pending.length);
      } catch (error) {
        console.error("Failed to fetch pending guests", error);
      }
    };

    fetchPendingGuests();
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

  // Close mobile drawer on outside click
  useEffect(() => {
    const handleMobileClickOutside = (event: MouseEvent) => {
      if (
        mobileDrawerOpen &&
        mobileDrawerRef.current &&
        !mobileDrawerRef.current.contains(event.target as Node)
      ) {
        setMobileDrawerOpen(false);
      }
    };

    if (mobileDrawerOpen) {
      document.addEventListener("mousedown", handleMobileClickOutside);
    }

    return () =>
      document.removeEventListener("mousedown", handleMobileClickOutside);
  }, [mobileDrawerOpen]);

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
    <>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <aside
          className={cn(
            " bg-white border-r hidden md:block border-gray-200 md:flex flex-col transition-all duration-300",
            isSidebarOpen ? "w-64" : "w-25",
          )}
        >
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
                        <Icon
                          icon={tab.icon}
                          className="text-xl flex-shrink-0"
                        />

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

        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-10 flex-shrink-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="md:hidden block border-b border-gray-200 flex items-center justify-between">
                <Link href="/dashboard" className="flex items-center gap-2">
                  <Image src="/rst.png" alt="RST" width={50} height={50} />
                </Link>
              </div>
              <button
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-md md:block hidden hover:bg-gray-200 cursor-pointer"
              >
                <Icon icon="mdi:menu" className="text-xl" />
              </button>

              {/* offcanvas button toogle  */}
              <button
                onClick={() => setOffcanvasOpen(true)}
                className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Icon icon="mdi:menu" className="text-xl" />
              </button>

              <h1 className="text-lg  font-semibold text-gray-800 md:block hidden">
                Podcast Management
              </h1>
            </div>

            <div className="flex items-center gap-4 relative" ref={userMenuRef}>
              {pendingGuestCount > 0 && (
                <button
                  onClick={() => router.push("/dashboard/guest?tab=pending")}
                  className="relative p-2 rounded-full cursor-pointer bg-red-50 hover:bg-red-100 transition"
                  title="Pending Guests"
                >
                  <Icon
                    icon="mdi:account-voice"
                    className="text-xl text-red-600"
                  />
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {pendingGuestCount}
                  </span>
                </button>
              )}
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
              <div>
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

                    <Link
                      href="/dashboard/settings"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Icon icon="mdi:cog" className="text-lg" />
                      Settings
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
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>

        {/* overlay */}

        {/* offcanvas module open  */}
        <aside
          className={`fixed top-0 left-0 h-full w-50 z-999 bg-white shadow-lg md:hidden transform transition-transform duration-300 ${
            offcanvasOpen ? "-translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="absolute right-4 top-4">
            <button
              onClick={() => setOffcanvasOpen(false)}
              className=" rounded-full text-xl  flex items-center justify-center"
            >
              <Icon icon="uil:multiply"></Icon>
            </button>
          </div>
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image src="/rst.png" alt="RST" height={50} width={80} />
            </Link>
          </div>

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
                        <Icon
                          icon={tab.icon}
                          className="text-xl flex-shrink-0"
                        />

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
      </div>

      {offcanvasOpen && (
        <div
          onClick={() => setOffcanvasOpen(false)}
          className="fixed inset-0 bg-black/25"
        ></div>
      )}
    </>
  );
}
