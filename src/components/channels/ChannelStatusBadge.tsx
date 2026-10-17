// components/channels/ChannelStatusBadge.tsx

import type { ChannelStatus } from "@/lib/api/channel";

const STYLES: Record<ChannelStatus, string> = {
  active: "text-green-700 bg-green-50",
  trial: "text-blue-700 bg-blue-50",
  suspended: "text-amber-700 bg-amber-50",
  cancelled: "text-gray-500 bg-gray-100",
};

export function ChannelStatusBadge({ status }: { status: ChannelStatus }) {
  return (
    <span
      className={`${STYLES[status] ?? STYLES.cancelled} px-2 py-0.5 rounded-full text-xs font-medium capitalize`}
    >
      {status}
    </span>
  );
}
