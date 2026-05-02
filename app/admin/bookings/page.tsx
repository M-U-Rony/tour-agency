"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarCheck, Plane } from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import type { BookingDTO, BookingStatus } from "@/lib/booking";
import { BOOKING_STATUS_LABEL, formatTravelDate } from "@/lib/booking";
import { formatBdt } from "@/lib/tour-package";

const STATUS_STYLE: Record<BookingStatus, string> = {
  pending:
    "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
  confirmed:
    "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
  cancelled:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20",
  completed:
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
};

const FILTERS: { id: "all" | BookingStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

export default function AdminBookingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthUser();
  const [bookings, setBookings] = useState<BookingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | BookingStatus>("all");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings?all=true", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { bookings: BookingDTO[] };
      setBookings(data.bookings ?? []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) router.push("/signin");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") router.replace("/dashboard");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user?.role === "admin") void loadBookings();
  }, [user?.role, loadBookings]);

  const filtered = useMemo(() => {
    if (filter === "all") return bookings;
    return bookings.filter((b) => b.status === filter);
  }, [bookings, filter]);

  async function setStatus(id: string, status: BookingStatus) {
    setPendingId(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      await loadBookings();
    } catch {
      // no-op for MVP
    } finally {
      setPendingId(null);
    }
  }

  if (authLoading || !user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/25">
              <Plane className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Admin
              </p>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">Bookings</h1>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-3 text-sm font-medium">
            <Link
              href="/admin/dashboard"
              className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/packages"
              className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Packages
            </Link>
            <span className="rounded-lg bg-indigo-50 px-3 py-2 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
              Bookings
            </span>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white inline-flex items-center gap-2">
            <CalendarCheck size={20} /> All bookings
          </h2>
          <button
            type="button"
            onClick={() => void loadBookings()}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            Refresh
          </button>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                filter === f.id
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
              }`}
            >
              {f.label}
              {f.id !== "all" && (
                <span className="ml-1 text-[10px] opacity-70">
                  ({bookings.filter((b) => b.status === f.id).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
            No bookings to display.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-900/40">
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Package</th>
                  <th className="px-5 py-3">Travel date</th>
                  <th className="px-5 py-3">Travelers</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/30">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {b.user?.username ?? "—"}
                      </p>
                      <p className="text-xs text-slate-500">{b.user?.email ?? ""}</p>
                      <p className="text-xs text-slate-500">{b.contactPhone}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {b.package?.title ?? "—"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {b.package?.location} · {b.package?.duration}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                      {formatTravelDate(b.travelDate)}
                    </td>
                    <td className="px-5 py-4 text-slate-700 dark:text-slate-300">{b.travelers}</td>
                    <td className="px-5 py-4 text-right font-semibold text-slate-900 dark:text-white">
                      {formatBdt(b.totalPriceBdt)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLE[b.status]}`}
                      >
                        {BOOKING_STATUS_LABEL[b.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {b.status === "pending" && (
                          <ActionButton
                            disabled={pendingId === b.id}
                            tone="confirm"
                            onClick={() => void setStatus(b.id, "confirmed")}
                          >
                            Confirm
                          </ActionButton>
                        )}
                        {b.status === "confirmed" && (
                          <ActionButton
                            disabled={pendingId === b.id}
                            tone="complete"
                            onClick={() => void setStatus(b.id, "completed")}
                          >
                            Mark completed
                          </ActionButton>
                        )}
                        {(b.status === "pending" || b.status === "confirmed") && (
                          <ActionButton
                            disabled={pendingId === b.id}
                            tone="cancel"
                            onClick={() => void setStatus(b.id, "cancelled")}
                          >
                            Cancel
                          </ActionButton>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

function ActionButton({
  tone,
  children,
  onClick,
  disabled,
}: {
  tone: "confirm" | "cancel" | "complete";
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  const styles =
    tone === "confirm"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
      : tone === "complete"
        ? "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300"
        : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${styles}`}
    >
      {children}
    </button>
  );
}
