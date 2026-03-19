// app/dashboard/page.tsx
"use client";

import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Icon } from "@iconify/react";
import { useEffect, useState, useMemo } from "react";
import { getUsers } from "@/lib/api/user";
import { getGuests, Guest } from "@/lib/api/guest";
import { getInterviews, Interview } from "@/lib/api/interview";
import { useRouter } from "next/navigation";
import { getMediaUrl } from "@/lib/utils";

/**
 * --------------------------------
 * REUSABLE STAT CARD (CoreUI-like)
 * --------------------------------
 */
function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}) {
  return (
    <Card className="border-gray-200">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
        <Icon icon={icon} className={`text-3xl ${color}`} />
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [hostCount, setHostCount] = useState(0);
  const [guestCount, setGuestCount] = useState(0);
  const [interviewCount, setInterviewCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  /**
   * --------------------------------
   * FETCH STATS
   * --------------------------------
   */
  useEffect(() => {
    const fetchOverviewStats = async () => {
      try {
        setLoadingStats(true);

        const [users, guests, interviews] = await Promise.all([
          getUsers(),
          getGuests(),
          getInterviews(),
        ]);

        const hosts = users.filter((user) =>
          user.roles?.some((role) => role.role_name === "Host"),
        );

        setHostCount(hosts.length);
        setGuestCount(guests.length);
        setInterviewCount(interviews.length);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchOverviewStats();
  }, []);

  /**
   * --------------------------------
   * FETCH GUESTS
   * --------------------------------
   */
  useEffect(() => {
    const fetchGuests = async () => {
      try {
        setLoading(true);
        const data_1 = await getGuests();
        setGuests(data_1 ?? []);
      } finally {
        setLoading(false);
      }
    };

    fetchGuests();
  }, []);

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        setLoading(true);
        const data_2 = await getInterviews();
        setInterviews(data_2 ?? []);
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, []);

  /**
   * --------------------------------
   * FILTER PENDING GUESTS
   * --------------------------------
   */
  const pendingGuests = useMemo(() => {
    let filtered = guests.filter((g) => !g.approved && !g.rejected);

    const hasRole = (roles: any[] | undefined, roleName: string) =>
      roles?.some((r) =>
        typeof r === "string" ? r === roleName : r.role_name === roleName,
      );

    const isHost = hasRole(user?.roles, "Host");

    if (isHost) {
      filtered = filtered.filter((g) => g.host_id === user?.id);
    }

    return filtered.slice(0, 3); // limit 3
  }, [guests, user]);

  /**
   * --------------------------------
   * FILTER UPCOMING INTERVIEWS
   * --------------------------------
   */
  // Only upcoming interviews (future dates)
  const upcomingInterviewsWidget = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    let data = interviews.filter(
      (i) => i.interview_date && i.interview_date > today,
    );

    // Only show interviews where current user is host
    const hasRole = (roles: any[] | undefined, roleName: string) =>
      roles?.some((r) =>
        typeof r === "string" ? r === roleName : r.role_name === roleName,
      );

    const isHost = hasRole(user?.roles, "Host");

    if (isHost) {
      data = data.filter((i) => i.host_id === user?.id);
    }

    // sort by date
    data.sort(
      (a, b) =>
        new Date(a.interview_date).getTime() -
        new Date(b.interview_date).getTime(),
    );

    return data.slice(0, 3); // limit 3
  }, [interviews, user]);

  /**
   * --------------------------------
   * FILTER PUBLISHED INTERVIEWS
   * --------------------------------
   */

  // Only published interviews
  const publishedInterviewsWidget = useMemo(() => {
    let data = interviews.filter((i) => i.status === "published");

    // sort by date descending
    data.sort(
      (a, b) =>
        new Date(b.interview_date).getTime() -
        new Date(a.interview_date).getTime(),
    );

    return data.slice(0, 3);
  }, [interviews]);

  const handleWidgetClick = () => {
    router.push("/dashboard/guest?tab=pending");
  };

  const handleUpcomingWidgetClick = () => {
    router.push("/dashboard/interview?tab=upcoming");
  };

  const handlePublishedClick = () => {
    router.push("/dashboard/interview?status=published");
  };

  /**
   * --------------------------------
   * UI
   * --------------------------------
   */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.full_name || "User"}
        </h2>
      </div>

      {/* ============================= */}
      {/* STATS (COREUI STYLE) */}
      {/* ============================= */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Hosts"
          value={loadingStats ? "—" : hostCount}
          icon="mdi:account-tie"
          color="text-blue-600"
        />
        <StatCard
          title="Total Guests"
          value={loadingStats ? "—" : guestCount}
          icon="mdi:account-voice"
          color="text-green-600"
        />
        <StatCard
          title="Total Interviews"
          value={loadingStats ? "—" : interviewCount}
          icon="mdi:microphone"
          color="text-purple-600"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8 md:grid-cols-2 grid-cols-1 items-start">
        {/* ============================= */}
        {/* GUEST APPROVAL */}
        {/* ============================= */}
        <Card className="border-gray-200 cursor-pointer hover:shadow-lg transition">
          <CardHeader>
            <div className="flex justify-between">
              <h3 className="font-semibold">
                Guest Approval ({pendingGuests.length})
              </h3>
              <div className="text-2xl">
                <Icon icon="mdi:account-clock" />
              </div>
            </div>
          </CardHeader>

          <CardContent onClick={handleWidgetClick}>
            {loading ? (
              <p>Loading...</p>
            ) : pendingGuests.length === 0 ? (
              <p>No pending guests</p>
            ) : (
              <div className="space-y-2">
                {pendingGuests.slice(0, 5).map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between p-2 rounded bg-gray-50 hover:bg-gray-100"
                  >
                    {/* LEFT */}
                    <div className="flex items-center gap-3">
                      <img
                        src={getMediaUrl(g.profileImage?.path)}
                        alt={g.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />

                      <div>
                        <p className="text-sm font-bold text-gray-600 mb-1">
                          {g.full_name}
                        </p>
                        <p className="text-vxs text-gray-500">
                          {g.designation ?? "—"}
                        </p>
                      </div>
                    </div>

                    <Icon icon="mdi:chevron-right" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* UPCOMING */}
        <Card className="border-gray-200 cursor-pointer hover:shadow-lg transition">
          <CardHeader>
            <div className="flex justify-between">
              <h3 className="font-semibold">Upcoming Interviews</h3>
              <div className="text-2xl">
                <Icon icon="material-symbols:event-upcoming-rounded" />
              </div>
            </div>
          </CardHeader>
          <CardContent onClick={handleUpcomingWidgetClick}>
            {upcomingInterviewsWidget.length === 0 ? (
              <p className="text-gray-500 text-sm ps-5 pb-3">
                No upcoming interviews
              </p>
            ) : (
              <div className="space-y-2">
                {upcomingInterviewsWidget.map((i) => (
                  <div
                    key={i.id}
                    className="flex items-start justify-between p-2 rounded bg-gray-50 hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={getMediaUrl(i.guest?.profileImage?.path)}
                        alt={i.guest?.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-xs text-blue-600 mb-1 text-vxs ">
                          {" "}
                          {i.interview_date}
                        </p>

                        <p className="text-sm font-bold text-gray-600 mb-1">
                          {i.guest?.full_name ?? "-"}
                        </p>

                        <p className="text-vxs text-gray-500 ">
                          {i.host?.full_name ?? "-"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <Icon icon="mdi:chevron-right" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* PUBLISHED */}
        <Card className="border-gray-200 cursor-pointer hover:shadow-lg transition">
          <CardHeader>
            <div className="flex justify-between">
              <h3 className="font-semibold">Published Interviews</h3>
              <div className="text-2xl">
                <Icon icon="material-symbols:published-with-changes" />
              </div>
            </div>
          </CardHeader>
          <CardContent onClick={handlePublishedClick}>
            {publishedInterviewsWidget.length === 0 ? (
              <p className="text-gray-500 text-sm ps-5 pb-3">
                No published interviews
              </p>
            ) : (
              <div className="space-y-2">
                {publishedInterviewsWidget.map((i) => (
                  <div
                    key={i.id}
                    className="flex items-start justify-between p-2 rounded bg-gray-50 hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={getMediaUrl(i.guest?.profileImage?.path)}
                        alt={i.guest?.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-xs text-blue-600 mb-1 text-vxs ">
                          {" "}
                          {i.interview_date}
                        </p>
                        <p className="text-sm font-bold text-gray-600 mb-1">
                          {i.guest?.full_name ?? "-"}
                        </p>
                        <p className="text-vxs text-gray-500">
                          {i.host?.full_name ?? "-"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <Icon icon="mdi:chevron-right" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
