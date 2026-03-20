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
import { toast } from "sonner";

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

  const recentApprovedGuests = useMemo(() => {
    let data = guests.filter((g) => g.approved === true);

    const hasRole = (roles: any[] | undefined, roleName: string) =>
      roles?.some((r) =>
        typeof r === "string" ? r === roleName : r.role_name === roleName,
      );

    const isHost = hasRole(user?.roles, "Host");

    if (isHost) {
      data = data.filter((g) => g.host_id === user?.id);
    }

    // latest first
    data.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    return data.slice(0, 3);
  }, [guests, user]);

  const isPendingMode = pendingGuests.length > 0;

  const displayGuests = isPendingMode ? pendingGuests : recentApprovedGuests;

  const title = isPendingMode ? "Requested Approval" : "Approved Guests";

  /**
   * --------------------------------
   * FILTER UPCOMING INTERVIEWS
   * --------------------------------
   */
  // Only upcoming interviews (future dates)
  const upcomingInterviewsWidget = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    let up_interview = interviews.filter(
      (i) => i.interview_date && i.interview_date > today,
    );

    // Only show interviews where current user is host
    const hasRole = (roles: any[] | undefined, roleName: string) =>
      roles?.some((r) =>
        typeof r === "string" ? r === roleName : r.role_name === roleName,
      );

    const isHost = hasRole(user?.roles, "Host");

    if (isHost) {
      up_interview = up_interview.filter((i) => i.host_id === user?.id);
    }

    // sort by date
    up_interview.sort(
      (a, b) =>
        new Date(a.interview_date).getTime() -
        new Date(b.interview_date).getTime(),
    );

    return up_interview.slice(0, 3); // limit 3
  }, [interviews, user]);

  const recentNonPublishedInterviews = useMemo(() => {
    let data = interviews.filter((i) => i.status !== "published");

    const hasRole = (roles: any[] | undefined, roleName: string) =>
      roles?.some((r) =>
        typeof r === "string" ? r === roleName : r.role_name === roleName,
      );

    const isHost = hasRole(user?.roles, "Host");

    if (isHost) {
      data = data.filter((i) => i.host_id === user?.id);
    }

    // latest first
    data.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return data.slice(0, 3);
  }, [interviews, user]);

  const isUpcomingMode = upcomingInterviewsWidget.length > 0;

  const displayInterviews = isUpcomingMode
    ? upcomingInterviewsWidget
    : recentNonPublishedInterviews;

  const interviewTitle = isUpcomingMode
    ? "Upcoming Interviews"
    : "Recent Interviews";

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

  const recentInterviewsFallback = useMemo(() => {
    let data = interviews;

    // latest first
    data.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return data.slice(0, 3);
  }, [interviews]);

  const isPublishedMode = publishedInterviewsWidget.length > 0;

  const displayPublished = isPublishedMode
    ? publishedInterviewsWidget
    : recentInterviewsFallback;

  const publishedTitle = isPublishedMode
    ? "Published Interviews"
    : "Recent Interviews";

  const getYoutubeWatchUrl = (url: string) => {
    try {
      const u = new URL(url);

      if (
        u.hostname.includes("youtube.com") &&
        u.pathname.includes("/embed/")
      ) {
        const id = u.pathname.split("/embed/")[1];
        return `https://www.youtube.com/watch?v=${id}`;
      }

      if (u.hostname === "youtu.be") {
        return `https://www.youtube.com/watch?v=${u.pathname.slice(1)}`;
      }

      return url;
    } catch {
      return url;
    }
  };

  const getYoutubeVideoId = (url?: string | null) => {
    if (!url) return null;

    try {
      const u = new URL(url);

      if (u.hostname.includes("youtube.com")) {
        return u.searchParams.get("v");
      }

      if (u.hostname === "youtu.be") {
        return u.pathname.slice(1);
      }

      if (u.pathname.includes("/embed/")) {
        return u.pathname.split("/embed/")[1];
      }

      return null;
    } catch {
      return null;
    }
  };

  const handleYoutubeClick = (link?: string | null) => {
    if (!link) {
      toast.error("No Youtube Link Available");
      return;
    }
    const url = getYoutubeWatchUrl(link);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleWidgetClick = () => {
    router.push("/dashboard/guest?tab=pending");
  };

  const handleUpcomingWidgetClick = () => {
    router.push("/dashboard/interview?tab=upcoming");
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
                {title} ({displayGuests.length})
              </h3>
              <div className="text-2xl">
                <Icon icon="mdi:account-clock" />
              </div>
            </div>
          </CardHeader>

          <CardContent onClick={handleWidgetClick}>
            {loading ? (
              <p>Loading...</p>
            ) : displayGuests.length === 0 ? (
              <p>No data available</p>
            ) : (
              <div className="space-y-2">
                {displayGuests.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between p-2 rounded bg-gray-50 hover:bg-gray-100"
                  >
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
              <h3 className="font-semibold">
                {interviewTitle} ({displayInterviews.length})
              </h3>
              <div className="text-2xl">
                <Icon icon="material-symbols:event-upcoming-rounded" />
              </div>
            </div>
          </CardHeader>
          <CardContent onClick={handleUpcomingWidgetClick}>
            {displayInterviews.length === 0 ? (
              <p className="text-gray-500 text-sm ps-5 pb-3">
                No data available
              </p>
            ) : (
              <div className="space-y-2">
                {displayInterviews.map((i) => (
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
                        <p className="text-xs text-blue-600 mb-1 text-vxs">
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

                    <Icon icon="mdi:chevron-right" />
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
              <h3 className="font-semibold">
                {publishedTitle} ({displayPublished.length})
              </h3>
              <div className="text-2xl">
                <Icon icon="material-symbols:published-with-changes" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {displayPublished.length === 0 ? (
              <p className="text-gray-500 text-sm ps-5 pb-3">
                No data available
              </p>
            ) : (
              <div className="space-y-2">
                {displayPublished.map((i) => {
                  const videoId = getYoutubeVideoId(i.youtube_link);

                  return (
                    <div
                      key={i.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleYoutubeClick(i.youtube_link);
                      }}
                      className="flex items-start justify-between p-2 rounded bg-gray-50 hover:bg-gray-100 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        {videoId ? (
                          <div className="relative w-[120px] h-[70px]">
                            <img
                              src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                              className="w-full h-full object-cover rounded"
                              alt="thumbnail"
                            />

                            {/* custom play button */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-red-600 p-2 rounded-full">
                                <Icon
                                  icon="mdi:play"
                                  className="text-white text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-[120px] h-[70px] flex items-center justify-center bg-gray-200 text-xs text-gray-500 rounded">
                            No Video
                          </div>
                        )}

                        <div>
                          <p className="text-xs text-blue-600 mb-1 text-vxs">
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
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
