"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileDrawer } from "@/components/layout/MobileDrawer";
import { TopBar } from "@/components/layout/TopBar";
import {
  CHANNEL_SIDEBAR_TABS,
  PLATFORM_ADMIN_SIDEBAR_TABS,
} from "@/components/layout/sidebarConfig";
import { usePendingGuestCount } from "@/hooks/usePendingGuestCount";
import { useInterviewStatusCounts } from "@/hooks/useInterviewStatusCounts";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const pendingGuestCount = usePendingGuestCount();
  const statusCounts = useInterviewStatusCounts();

  const isPlatformAdminArea = pathname.startsWith("/dashboard/platform-admin");
  const tabs = isPlatformAdminArea
    ? PLATFORM_ADMIN_SIDEBAR_TABS
    : CHANNEL_SIDEBAR_TABS;

  // Protect route
  useEffect(() => {
    if (!loading && user && isPlatformAdminArea && !user.is_platform_admin) {
      router.replace("/dashboard");
    }
  }, [user, loading, isPlatformAdminArea, router]);

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar
          tabs={tabs}
          isOpen={isSidebarOpen}
          isPlatformArea={isPlatformAdminArea}
          statusCounts={statusCounts}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <TopBar
            pendingGuestCount={pendingGuestCount}
            isPlatformArea={isPlatformAdminArea}
            onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
            onOpenDrawer={() => setDrawerOpen(true)}
          />

          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>

      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        tabs={tabs}
        isPlatformArea={isPlatformAdminArea}
        statusCounts={statusCounts}
      />
    </>
  );
}
