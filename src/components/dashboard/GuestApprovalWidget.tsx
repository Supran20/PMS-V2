"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { Guest } from "@/lib/api/guest";
import { GuestReapprovalRequest } from "@/lib/api/guestReapproval";
import { getMediaUrl } from "@/lib/utils";
import { WidgetCard } from "./WidgetCard";

interface GuestApprovalWidgetProps {
  guests: Guest[];
  reapprovalRequests: GuestReapprovalRequest[];
  loading: boolean;
  isHost: boolean;
  userId?: string;
}

export function GuestApprovalWidget({
  guests,
  reapprovalRequests,
  loading,
  isHost,
  userId,
}: GuestApprovalWidgetProps) {
  const router = useRouter();

  const pendingReapprovalGuestIds = useMemo(
    () => new Set(reapprovalRequests.map((r) => r.guest_id)),
    [reapprovalRequests],
  );

  const pendingGuests = useMemo(() => {
    let filtered = guests.filter(
      (g) =>
        (!g.approved && !g.rejected) || pendingReapprovalGuestIds.has(g.id),
    );

    if (isHost) {
      filtered = filtered.filter((g) => g.host_id === userId);
    }

    return filtered.slice(0, 3);
  }, [guests, isHost, userId, pendingReapprovalGuestIds]);

  const recentApprovedGuests = useMemo(() => {
    let data = guests.filter(
      (g) => g.approved === true && !pendingReapprovalGuestIds.has(g.id),
    );

    if (isHost) {
      data = data.filter((g) => g.host_id === userId);
    }

    // latest first
    data.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    return data.slice(0, 3);
  }, [guests, isHost, userId, pendingReapprovalGuestIds]);

  const isPendingMode = pendingGuests.length > 0;
  const displayGuests = isPendingMode ? pendingGuests : recentApprovedGuests;
  const title = isPendingMode
    ? "Request for Approval"
    : "Recently Approved Guest";

  const handleGuestClick = (g: Guest) => {
    if (!isPendingMode) {
      router.push(`/dashboard/guest/view/${g.slug}`);
    } else if (pendingReapprovalGuestIds.has(g.id)) {
      router.push("/dashboard/guest?tab=reapproval");
    } else if (g.approved) {
      router.push("/dashboard/guest?tab=approved");
    } else {
      router.push("/dashboard/guest?tab=pending");
    }
  };

  const handleWidgetClick = () => {
    if (isPendingMode) {
      if (
        reapprovalRequests.length > 0 &&
        pendingGuests.every((g) => pendingReapprovalGuestIds.has(g.id))
      ) {
        router.push("/dashboard/guest?tab=reapproval");
      } else {
        router.push("/dashboard/guest?tab=pending");
      }
    } else {
      router.push("/dashboard/guest?tab=approved");
    }
  };

  return (
    <WidgetCard
      title={title}
      count={displayGuests.length}
      icon="mdi:account-clock"
      onClick={handleWidgetClick}
    >
      {loading ? (
        <p>Loading...</p>
      ) : displayGuests.length === 0 ? (
        <p>No data available</p>
      ) : (
        <div className="space-y-2">
          {displayGuests.map((g) => (
            <div
              key={g.id}
              onClick={(e) => {
                e.stopPropagation();
                handleGuestClick(g);
              }}
              className="flex items-center justify-between p-2 rounded bg-gray-50 hover:bg-gray-100 cursor-pointer"
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
    </WidgetCard>
  );
}
