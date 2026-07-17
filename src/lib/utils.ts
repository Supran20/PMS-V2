import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ReapprovalTriggerSource } from "@/lib/api/guestReapproval";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Build full URL for media files (images served from API server at localhost:4000) */
export function getMediaUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_MEDIA_BASE_URL ||
    "http://localhost:4000";
  const origin = base.replace(/\/api\/?$/, "");
  return `${origin}${path.startsWith("/") ? "" : "/"}${path}`;
}

/**
 * Generates a URL-friendly slug from a string.
 */
export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

export function getInitials(fullName: string): string {
  if (!fullName) return "?";

  const parts = fullName.trim().split(" ");

  if (parts.length === 1) {
    const name = parts[0];
    return (name[0] + name[name.length - 1]).toUpperCase();
  }

  const first = parts[0][0];
  const last = parts[parts.length - 1][0];

  return (first + last).toUpperCase();
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return "-";

  const [year, month, day] = dateString.split("-").map(Number);

  const date = new Date(year, month - 1, day); // local fixed date

  const weekday = date.toLocaleDateString("en-US", {
    weekday: "short",
  });

  const monthName = date.toLocaleDateString("en-US", {
    month: "short",
  });

  const getOrdinal = (n: number) => {
    if (n > 3 && n < 21) return `${n}th`;

    switch (n % 10) {
      case 1:
        return `${n}st`;
      case 2:
        return `${n}nd`;
      case 3:
        return `${n}rd`;
      default:
        return `${n}th`;
    }
  };

  return `${weekday}, ${getOrdinal(day)} ${monthName} ${year}`;
}

export interface ReapprovalErrorInfo {
  triggerSource: ReapprovalTriggerSource;
  status: "found" | "pending";
  guestId: string;
  guestName: string | null;
  reapprovalRequestId: string | null;
}

const CODE_MAP: Record<
  string,
  Pick<ReapprovalErrorInfo, "triggerSource" | "status">
> = {
  GUEST_DUPLICATE_FOUND: {
    triggerSource: "duplicate_guest_attempt",
    status: "found",
  },
  GUEST_DUPLICATE_PENDING_REVIEW: {
    triggerSource: "duplicate_guest_attempt",
    status: "pending",
  },
  GUEST_REQUIRES_REAPPROVAL_NEW: {
    triggerSource: "repeat_booking",
    status: "found",
  },
  GUEST_REQUIRES_REAPPROVAL_PENDING: {
    triggerSource: "repeat_booking",
    status: "pending",
  },
};

/**
 * Returns structured info if this error is one of the guest-reapproval
 * 409s, or null if it's an unrelated error the caller should handle
 * normally (e.g. a generic toast).
 */
export function parseReapprovalError(error: any): ReapprovalErrorInfo | null {
  const code = error?.response?.data?.code;
  const mapping = code ? CODE_MAP[code] : undefined;
  if (!mapping) return null;

  const guestId = error?.response?.data?.guestId;
  if (!guestId) return null;

  return {
    ...mapping,
    guestId,
    guestName: error?.response?.data?.guestName ?? null,
    reapprovalRequestId: error?.response?.data?.reapprovalRequestId ?? null,
  };
}
