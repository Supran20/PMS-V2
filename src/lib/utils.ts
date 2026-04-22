import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

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
