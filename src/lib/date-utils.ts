const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isValidDate(date: Date | null | undefined): date is Date {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

/**
 * Parse API / form date-only strings (YYYY-MM-DD) into a local Date
 * without UTC timezone shifts from `new Date("YYYY-MM-DD")`.
 */
export function parseDateOnly(
  value: string | Date | null | undefined,
): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return isValidDate(value) ? value : null;
  }

  const datePart = value.split("T")[0];
  const match = datePart.match(DATE_ONLY_RE);
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return isValidDate(date) ? date : null;
}

/**
 * Format a Date as YYYY-MM-DD using local calendar components.
 */
export function toDateOnlyString(
  date: Date | null | undefined,
): string | undefined {
  if (!isValidDate(date)) return undefined;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Normalize a date value for multipart FormData.
 * Returns YYYY-MM-DD, the explicit null sentinel, or undefined to omit.
 */
export function formatDateForFormData(
  value: Date | string | null | undefined,
  { allowNull = false }: { allowNull?: boolean } = {},
): string | undefined {
  if (value === undefined) return undefined;
  if (value === null) return allowNull ? "null" : undefined;

  if (typeof value === "string") {
    if (value === "null") return allowNull ? "null" : undefined;
    if (DATE_ONLY_RE.test(value)) return value;

    const parsed = parseDateOnly(value);
    return parsed ? toDateOnlyString(parsed) : undefined;
  }

  return toDateOnlyString(value);
}
