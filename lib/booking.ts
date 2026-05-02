export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

const TRAVEL_DATE_INPUT_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parse `YYYY-MM-DD` from `<input type="date">` as a UTC calendar date (avoids timezone shifts). */
export function parseTravelDateFromClient(input: string): Date | null {
  const m = TRAVEL_DATE_INPUT_RE.exec(input.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== mo - 1 ||
    date.getUTCDate() !== d
  ) {
    return null;
  }
  return date;
}

/** Format a booking travel instant (UTC midnight for that calendar day) for display. */
export function formatTravelDate(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Whole calendar days from local today to the travel date (UTC Y-M-D treated as the user's chosen day).
 */
export function travelDateDaysFromLocalToday(iso: string): number | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const y = date.getUTCFullYear();
  const mo = date.getUTCMonth();
  const d = date.getUTCDate();
  const travelLocal = new Date(y, mo, d);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((travelLocal.getTime() - startToday.getTime()) / 86_400_000);
}

export function travelDateIsOnOrAfterLocalToday(iso: string): boolean {
  const n = travelDateDaysFromLocalToday(iso);
  return n !== null && n >= 0;
}

export function travelDateIsBeforeLocalToday(iso: string): boolean {
  const n = travelDateDaysFromLocalToday(iso);
  return n !== null && n < 0;
}

export type BookingDTO = {
  id: string;
  userId: string;
  packageId: string;
  travelDate: string;
  travelers: number;
  contactPhone: string;
  notes: string;
  status: BookingStatus;
  totalPriceBdt: number;
  createdAt: string;
  package?: {
    id: string;
    title: string;
    location: string;
    duration: string;
    imageUrl: string;
    priceBdt: number;
  } | null;
  user?: {
    id: string;
    username: string;
    email: string;
  } | null;
};

type RawPackage = {
  _id: unknown;
  title?: string;
  location?: string;
  duration?: string;
  imageUrl?: string;
  priceBdt?: number;
};

type RawUser = {
  _id: unknown;
  name?: string;
  email?: string;
};

type RawBooking = {
  _id: unknown;
  userId: unknown;
  packageId: unknown;
  travelDate: Date | string;
  travelers: number;
  contactPhone: string;
  notes?: string;
  status: BookingStatus;
  totalPriceBdt: number;
  createdAt: Date | string;
};

function toIso(value: Date | string | undefined): string {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
}

export function serializeBooking(
  doc: RawBooking,
  pkg?: RawPackage | null,
  user?: RawUser | null
): BookingDTO {
  return {
    id: String(doc._id),
    userId: String(doc.userId),
    packageId: String(doc.packageId),
    travelDate: toIso(doc.travelDate),
    travelers: doc.travelers,
    contactPhone: doc.contactPhone,
    notes: doc.notes ?? "",
    status: doc.status,
    totalPriceBdt: doc.totalPriceBdt,
    createdAt: toIso(doc.createdAt),
    package: pkg
      ? {
          id: String(pkg._id),
          title: pkg.title ?? "",
          location: pkg.location ?? "",
          duration: pkg.duration ?? "",
          imageUrl: pkg.imageUrl ?? "",
          priceBdt: pkg.priceBdt ?? 0,
        }
      : null,
    user: user
      ? {
          id: String(user._id),
          username: user.name ?? "",
          email: user.email ?? "",
        }
      : null,
  };
}

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
};
