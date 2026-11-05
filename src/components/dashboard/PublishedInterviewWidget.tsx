"use client";

import React, { useMemo } from "react";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { Interview } from "@/lib/api/interview";
import { getYoutubeVideoId, getYoutubeWatchUrl } from "@/lib/youtube";
import { WidgetCard } from "./WidgetCard";

interface PublishedInterviewsWidgetProps {
  interviews: Interview[];
}

export function PublishedInterviewsWidget({
  interviews,
}: PublishedInterviewsWidgetProps) {
  const published = useMemo(() => {
    const data = interviews.filter((i) => i.status === "published");

    // newest interview date first
    data.sort((a, b) => {
      const dateA = a.interview_date ? new Date(a.interview_date).getTime() : 0;
      const dateB = b.interview_date ? new Date(b.interview_date).getTime() : 0;

      return dateB - dateA;
    });

    return data.slice(0, 3);
  }, [interviews]);

  const recentFallback = useMemo(
    () =>
      // sort a copy so the interviews state is never mutated
      [...interviews]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 3),
    [interviews],
  );

  const isPublishedMode = published.length > 0;
  const displayPublished = isPublishedMode ? published : recentFallback;
  const title = isPublishedMode ? "Published Interviews" : "Recent Interviews";

  const handleYoutubeClick = (link?: string | null) => {
    if (!link) {
      toast.error("No Youtube Link Available");
      return;
    }
    window.open(getYoutubeWatchUrl(link), "_blank", "noopener,noreferrer");
  };

  return (
    <WidgetCard
      title={title}
      count={displayPublished.length}
      icon="material-symbols:published-with-changes"
    >
      {displayPublished.length === 0 ? (
        <p className="text-gray-500 text-sm ps-5 pb-3">No data available</p>
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
    </WidgetCard>
  );
}
