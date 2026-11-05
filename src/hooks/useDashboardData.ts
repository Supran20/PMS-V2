import { useEffect, useState } from "react";
import { getUsers } from "@/lib/api/user";
import { getGuests, Guest } from "@/lib/api/guest";
import { getInterviews, Interview } from "@/lib/api/interview";
import {
  getReapprovalRequests,
  GuestReapprovalRequest,
} from "@/lib/api/guestReapproval";

export function useDashboardData() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [reapprovalRequests, setReapprovalRequests] = useState<
    GuestReapprovalRequest[]
  >([]);
  const [hostCount, setHostCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const [usersRes, guestsRes, interviewsRes, reapprovalRes] =
        await Promise.allSettled([
          getUsers(),
          getGuests(),
          getInterviews(),
          getReapprovalRequests("pending"),
        ]);

      if (cancelled) return;

      if (usersRes.status === "fulfilled") {
        setHostCount(
          usersRes.value.filter((user) =>
            user.roles?.some((role) => role.role_name === "Host"),
          ).length,
        );
      }
      if (guestsRes.status === "fulfilled") {
        setGuests(guestsRes.value ?? []);
      }
      if (interviewsRes.status === "fulfilled") {
        setInterviews(interviewsRes.value ?? []);
      }
      if (reapprovalRes.status === "fulfilled") {
        setReapprovalRequests(reapprovalRes.value ?? []);
      }

      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { guests, interviews, reapprovalRequests, hostCount, loading };
}
