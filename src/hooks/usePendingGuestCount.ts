import { useEffect, useState } from "react";
import { getGuests } from "@/lib/api/guest";

export function usePendingGuestCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await getGuests();
        if (!cancelled) {
          setCount(data.filter((g) => !g.approved && !g.rejected).length);
        }
      } catch (error) {
        console.error("Failed to fetch pending guests", error);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return count;
}
