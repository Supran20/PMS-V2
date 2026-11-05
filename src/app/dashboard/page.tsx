// app/dashboard/page.tsx
"use client";

import { useAuth } from "@/context/AuthContext";
import { userHasRole } from "@/lib/utils";
import { useDashboardData } from "@/hooks/useDashboardData";
import { StatCard } from "@/components/dashboard/StatCard";
import { GuestApprovalWidget } from "@/components/dashboard/GuestApprovalWidget";
import { UpcomingInterviewsWidget } from "@/components/dashboard/UpcomingInterviewWidget";
import { PublishedInterviewsWidget } from "@/components/dashboard/PublishedInterviewWidget";

export default function DashboardPage() {
  const { user } = useAuth();
  const { guests, interviews, reapprovalRequests, hostCount, loading } =
    useDashboardData();

  const isHost = userHasRole(user?.roles, "Host");

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.full_name || "User"}
        </h2>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Hosts"
          value={loading || hostCount === null ? "—" : hostCount}
          icon="mdi:account-tie"
          color="text-blue-600"
        />
        <StatCard
          title="Total Guests"
          value={loading ? "—" : guests.length}
          icon="mdi:account-voice"
          color="text-green-600"
        />
        <StatCard
          title="Total Interviews"
          value={loading ? "—" : interviews.length}
          icon="mdi:microphone"
          color="text-purple-600"
        />
      </div>

      {/* WIDGETS */}
      <div className="grid lg:grid-cols-3 gap-8 md:grid-cols-2 grid-cols-1 items-start">
        <GuestApprovalWidget
          guests={guests}
          reapprovalRequests={reapprovalRequests}
          loading={loading}
          isHost={isHost}
          userId={user?.id}
        />
        <UpcomingInterviewsWidget
          interviews={interviews}
          isHost={isHost}
          userId={user?.id}
        />
        <PublishedInterviewsWidget interviews={interviews} />
      </div>
    </div>
  );
}
