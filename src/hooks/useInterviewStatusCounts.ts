import { useMemo } from "react";
import { useInterview } from "@/context/InterviewContext";

export function useInterviewStatusCounts() {
  const { interviews } = useInterview();

  return useMemo(() => {
    const counts: Record<string, number> = {};

    interviews.forEach((i) => {
      const status = i.status || "";
      counts[status] = (counts[status] || 0) + 1;
    });

    counts[""] = interviews.length;

    return counts;
  }, [interviews]);
}
