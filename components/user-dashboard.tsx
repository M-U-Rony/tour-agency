"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { AuthUser } from "@/lib/auth-user";
import { clientSignOut } from "@/lib/client-auth";
import {
  MapPin,
  Menu,
  X,
  Bell,
  ChevronDown,
  LogOut,
  Compass,
  CalendarDays,
  Plane,
  CreditCard,
  Clock,
  User,
} from "lucide-react";
import type { BookingDTO, BookingStatus } from "@/lib/booking";
import {
  BOOKING_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  formatTravelDate,
  travelDateDaysFromLocalToday,
  travelDateIsBeforeLocalToday,
  travelDateIsOnOrAfterLocalToday,
} from "@/lib/booking";
import { formatBdt } from "@/lib/tour-package";
import { getUserAvatarUrl } from "@/lib/user-avatar";

function displayFirstName(username: string) {
  const part = username.trim().split(/\s+/)[0];
  return part || username;
}

const STATUS_STYLE: Record<BookingStatus, string> = {
  pending:
    "bg-amber-50 text-amber-800 border-amber-200",
  confirmed:
    "bg-emerald-50 text-emerald-800 border-emerald-200",
  cancelled:
    "bg-red-50 text-red-700 border-red-200",
  completed:
    "bg-slate-100 text-slate-700 border-slate-200",
};

export default function UserDashboard({ user }: { user: AuthUser }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const firstName = displayFirstName(user.username);
  const avatarSrc = getUserAvatarUrl(user);

  const [bookings, setBookings] = useState<BookingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings", { credentials: "include" });
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
    void loadBookings();
  }, [loadBookings]);

  const upcoming = useMemo(() => {
    return bookings
      .filter(
        (b) =>
          (b.status === "pending" || b.status === "confirmed") &&
          travelDateIsOnOrAfterLocalToday(b.travelDate)
      )
      .sort(
        (a, b) =>
          new Date(a.travelDate).getTime() - new Date(b.travelDate).getTime()
      );
  }, [bookings]);

  const past = useMemo(() => {
    return bookings.filter(
      (b) =>
        b.status === "completed" ||
        b.status === "cancelled" ||
        travelDateIsBeforeLocalToday(b.travelDate)
    );
  }, [bookings]);

  const next = upcoming[0] ?? null;

  async function cancelBooking(id: string) {
    setPendingId(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (!res.ok) throw new Error("Could not cancel");
      await loadBookings();
    } catch {
      // no-op; UI keeps the booking, simple MVP
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex h-screen bg-[#f4fbf8] text-slate-900 font-sans overflow-hidden">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-emerald-100 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center px-6 border-b border-emerald-100">
            <div className="flex items-center gap-2 text-teal-700 font-bold text-xl tracking-tight">
              <Plane className="w-6 h-6" />
              <span>ExploreBD</span>
            </div>
            <button
              className="ml-auto lg:hidden text-slate-500"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            <NavItem icon={<Compass size={20} />} label="Explore Tours" href="/tours" />
            <NavItem
              icon={<CalendarDays size={20} />}
              label="My Bookings"
              href="/dashboard"
              active={pathname === "/dashboard"}
            />
            <NavItem
              icon={<Plane size={20} />}
              label="My custom trips"
              href="/custom-trips"
              active={pathname === "/custom-trips"}
            />
            <div className="mt-3 px-4 pt-3 text-xs font-semibold uppercase tracking-wider text-slate-400 border-t border-emerald-100">
              Profile
            </div>
            <NavItem
              icon={<User size={20} />}
              label="Edit profile"
              href="/profile"
              active={pathname === "/profile"}
            />
          </nav>

          <div className="p-4 border-t border-emerald-100">
            <button
              type="button"
              className="flex items-center gap-3 w-full px-4 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              onClick={() => void clientSignOut(router)}
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 bg-white/90 backdrop-blur-md border-b border-emerald-100 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-slate-500 hover:text-slate-900"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold tracking-tight hidden sm:block">My Dashboard</h1>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-500 hover:text-slate-900 transition-colors rounded-full hover:bg-emerald-50">
              <Bell className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 cursor-pointer pl-2 hover:opacity-80 transition-opacity">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarSrc}
                alt=""
                className="w-9 h-9 rounded-full object-cover border-2 border-teal-200 shadow-sm"
              />
              <div className="hidden md:block text-sm">
                <p className="font-medium">{user.username}</p>
                <p className="text-xs text-slate-500">Explorer</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Welcome back, {firstName}!
              </h2>
              <p className="text-slate-500 mt-1">
                Here are your upcoming and past bookings.
              </p>
            </div>

            {next ? (
              <div className="relative rounded-3xl overflow-hidden shadow-lg shadow-teal-900/5 border border-teal-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    next.package?.imageUrl ||
                    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop"
                  }
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-slate-900/90 via-slate-900/40 to-transparent" />

                <div className="relative p-6 sm:p-8 md:p-10 flex flex-col md:flex-row md:items-end justify-between gap-6 min-h-[280px]">
                  <div className="text-white">
                    {(() => {
                      const days = travelDateDaysFromLocalToday(next.travelDate);
                      return days != null && days >= 0 ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-4 border border-white/30">
                          <Clock size={14} />
                          <span>
                            {days === 0 ? "Today" : `In ${days} day${days === 1 ? "" : "s"}`}
                          </span>
                        </div>
                      ) : null;
                    })()}
                    <h3 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2 drop-shadow-md">
                      {next.package?.title ?? "Your trip"}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-slate-200 text-sm">
                      <span className="flex items-center gap-1">
                        <CalendarDays size={16} /> {formatTravelDate(next.travelDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <UsersIcon size={16} /> {next.travelers} Traveler
                        {next.travelers === 1 ? "" : "s"}
                      </span>
                      <span className="flex items-center gap-1">
                        <CreditCard size={16} /> {formatBdt(next.totalPriceBdt)}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLE[next.status]}`}
                      >
                        {BOOKING_STATUS_LABEL[next.status]}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    {next.package && (
                      <Link
                        href={`/tours/${next.package.id}`}
                        className="flex-1 md:flex-none flex justify-center items-center gap-2 px-5 py-3 bg-white text-slate-900 hover:bg-[#f4fbf8] font-semibold rounded-xl transition-colors shadow-sm"
                      >
                        View tour
                      </Link>
                    )}
                    {next.status === "pending" && (
                      <button
                        type="button"
                        disabled={pendingId === next.id}
                        onClick={() => void cancelBooking(next.id)}
                        className="flex-1 md:flex-none flex justify-center items-center gap-2 px-5 py-3 bg-red-500/90 hover:bg-red-500 text-white font-semibold rounded-xl transition-colors shadow-sm border border-red-400/40 disabled:opacity-60"
                      >
                        {pendingId === next.id ? "Cancelling…" : "Cancel"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-emerald-200 bg-white p-10 text-center">
                <h3 className="text-xl font-bold">No upcoming trips</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Browse our packages and request your next adventure.
                </p>
                <Link
                  href="/tours"
                  className="mt-5 inline-block rounded-xl bg-teal-50 text-teal-900 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-teal-100 shadow-sm"
                >
                  Explore tours
                </Link>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Upcoming bookings</h3>
                  <Link
                    href="/tours"
                    className="text-sm font-medium text-teal-700 hover:text-teal-800 hover:underline"
                  >
                    Book another
                  </Link>
                </div>

                {loading ? (
                  <div className="flex justify-center py-10">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-t-transparent" />
                  </div>
                ) : upcoming.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-emerald-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
                    No upcoming bookings yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {upcoming.map((b) => (
                      <BookingRow
                        key={b.id}
                        booking={b}
                        onCancel={() => void cancelBooking(b.id)}
                        cancelling={pendingId === b.id}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-emerald-100 p-6 shadow-sm">
                  <h3 className="text-lg font-bold mb-4">Past trips</h3>
                  {past.length === 0 ? (
                    <p className="text-sm text-slate-500">No past trips yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {past.slice(0, 6).map((b) => (
                        <div
                          key={b.id}
                          className="flex gap-4 p-3 hover:bg-[#f4fbf8] rounded-xl transition-colors"
                        >
                          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 shrink-0">
                            <MapPin size={22} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">
                              {b.package?.title ?? "Tour"}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {formatTravelDate(b.travelDate)} · {formatBdt(b.totalPriceBdt)}
                            </p>
                            <span
                              className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_STYLE[b.status]}`}
                            >
                              {BOOKING_STATUS_LABEL[b.status]}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function BookingRow({
  booking,
  onCancel,
  cancelling,
}: {
  booking: BookingDTO;
  onCancel: () => void;
  cancelling: boolean;
}) {
  const days = travelDateDaysFromLocalToday(booking.travelDate);
  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl border border-emerald-100 bg-white shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={
          booking.package?.imageUrl ||
          "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop"
        }
        alt=""
        className="h-28 w-full sm:w-40 rounded-xl object-cover"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="font-bold truncate">
              {booking.package?.title ?? "Tour"}
            </h4>
            <p className="text-sm text-slate-500 mt-0.5">
              {booking.package?.location ?? ""} · {booking.package?.duration ?? ""}
            </p>
          </div>
          <span
            className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLE[booking.status]}`}
          >
            {BOOKING_STATUS_LABEL[booking.status]}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
          <span className="inline-flex items-center gap-1">
            <CalendarDays size={14} /> {formatTravelDate(booking.travelDate)}
            {days != null && days >= 0 && (
              <span className="text-xs text-slate-400">
                ({days === 0 ? "today" : `in ${days}d`})
              </span>
            )}
          </span>
          <span className="inline-flex items-center gap-1">
            <UsersIcon size={14} /> {booking.travelers}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
            {formatBdt(booking.totalPriceBdt)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-800">
            {PAYMENT_STATUS_LABEL[booking.paymentStatus]}
          </span>
        </div>
        <BookingTimeline booking={booking} />
        <div className="mt-3 flex flex-wrap gap-2">
          {booking.package && (
            <Link
              href={`/tours/${booking.package.id}`}
              className="rounded-lg border border-emerald-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-[#f4fbf8]"
            >
              View tour
            </Link>
          )}
          {booking.status === "pending" && (
            <button
              type="button"
              disabled={cancelling}
              onClick={onCancel}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
            >
              {cancelling ? "Cancelling…" : "Cancel"}
            </button>
          )}
          {booking.status === "completed" && (
            <ReviewPrompt booking={booking} />
          )}
        </div>
      </div>
    </div>
  );
}

function BookingTimeline({ booking }: { booking: BookingDTO }) {
  const steps = [
    { id: "pending", label: "Requested", done: true },
    {
      id: "confirmed",
      label: "Confirmed",
      done: booking.status === "confirmed" || booking.status === "completed",
    },
    {
      id: "payment",
      label: "Payment noted",
      done:
        booking.paymentStatus === "advance_paid" ||
        booking.paymentStatus === "paid" ||
        booking.paymentStatus === "refunded",
    },
    { id: "completed", label: "Completed", done: booking.status === "completed" },
  ];
  if (booking.status === "cancelled") {
    return (
      <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
        This booking was cancelled.
      </div>
    );
  }
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-4">
      {steps.map((step) => (
        <div
          key={step.id}
          className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
            step.done
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-emerald-100 bg-white text-slate-500"
          }`}
        >
          {step.label}
        </div>
      ))}
    </div>
  );
}

function ReviewPrompt({ booking }: { booking: BookingDTO }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitReview() {
    setSubmitting(true);
    setMessage("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ bookingId: booking.id, rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not submit review");
      setMessage("Review submitted.");
      setOpen(false);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Could not submit review");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100"
      >
        Review trip
      </button>
    );
  }

  return (
    <div className="w-full rounded-xl border border-emerald-100 bg-[#f4fbf8] p-3">
      <div className="flex flex-wrap gap-2">
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="rounded-lg border border-emerald-100 bg-white px-3 py-2 text-xs font-semibold"
        >
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value} stars
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void submitReview()}
          disabled={submitting || comment.trim().length < 5}
          className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit review"}
        </button>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="What should future travelers know?"
        className="mt-2 w-full resize-y rounded-lg border border-emerald-100 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500"
      />
      {message && <p className="mt-2 text-xs text-slate-500">{message}</p>}
    </div>
  );
}

function NavItem({
  icon,
  label,
  active,
  badge,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: string;
  href?: string;
}) {
  const className = `flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
    active
      ? "bg-teal-50 text-teal-900 font-semibold"
      : "text-slate-600 hover:bg-emerald-50 hover:text-slate-900"
  }`;
  const inner = (
    <>
      <div className="flex items-center gap-3 font-medium text-sm">
        <span
          className={`${
            active
              ? "text-teal-900"
              : "text-slate-400 group-hover:text-teal-700 transition-colors"
          }`}
        >
          {icon}
        </span>
        {label}
      </div>
      {badge && (
        <span
          className={`px-2 py-0.5 text-xs font-bold rounded-full ${
            active
              ? "bg-teal-700/10 text-teal-900"
              : "bg-emerald-100 text-emerald-800"
          }`}
        >
          {badge}
        </span>
      )}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }
  return (
    <a href="#" className={className}>
      {inner}
    </a>
  );
}

function UsersIcon({ size }: { size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
