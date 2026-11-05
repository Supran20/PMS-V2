"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { Interview } from "@/lib/api/interview";
import { getMediaUrl } from "@/lib/utils";
import { WidgetCard } from "./WidgetCard";

interface UpcomingInterviewsWidgetProps {
  interviews: Interview[];
  isHost: boolean;
  userId?: string;
}

export function UpcomingInterviewsWidget({
  interviews,
  isHost,
  userId,
}: UpcomingInterviewsWidgetProps) {
  const router = useRouter();

  const upcoming = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    let data = interviews.filter(
      (i) => i.interview_date && i.interview_date >= today,
    );

    // Hosts only see their own interviews
    if (isHost) {
      data = data.filter((i) => i.host_id === userId);
    }

    // earliest first
    data.sort((a, b) => {
      const dateA = a.interview_date ? new Date(a.interview_date).getTime() : 0;
      const dateB = b.interview_date ? new Date(b.interview_date).getTime() : 0;

      return dateA - dateB;
    });

    return data.slice(0, 3);
  }, [interviews, isHost, userId]);

  const recentNonPublished = useMemo(() => {
    let data = interviews.filter((i) => i.status !== "published");

    if (isHost) {
      data = data.filter((i) => i.host_id === userId);
    }

    // latest first
    data.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return data.slice(0, 3);
  }, [interviews, isHost, userId]);

  const isUpcomingMode = upcoming.length > 0;
  const displayInterviews = isUpcomingMode ? upcoming : recentNonPublished;
  const title = isUpcomingMode ? "Upcoming Interviews" : "Recent Interviews";

  const handleWidgetClick = () => {
    if (isUpcomingMode) {
      router.push("/dashboard/interview?tab=upcoming");
    } else {
      router.push("/dashboard/interview");
    }
  };

  const handleInterviewClick = (i: Interview) => {
    if (i.status) {
      router.push(`/dashboard/interview?status=${i.status}`);
    } else {
      router.push("/dashboard/interview");
    }
  };

  return (
    <WidgetCard
      title={title}
      count={displayInterviews.length}
      icon="material-symbols:event-upcoming-rounded"
      onClick={handleWidgetClick}
    >
      {displayInterviews.length === 0 ? (
        <p className="text-gray-500 text-sm ps-5 pb-3">No data available</p>
      ) : (
        <div className="space-y-2">
          {displayInterviews.map((i) => (
            <div
              key={i.id}
              onClick={(e) => {
                e.stopPropagation();
                handleInterviewClick(i);
              }}
              className="flex items-start justify-between p-2 rounded bg-gray-50 hover:bg-gray-100 cursor-pointer"
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
    </WidgetCard>
  );
}
