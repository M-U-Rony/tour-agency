"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Compass, Clock, MapPin, CalendarDays, Download, Mail, UserCheck, Megaphone } from "lucide-react";
import type { AuthUser } from "@/lib/auth-user";
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
import AccountShell from "@/components/account-shell";

function displayFirstName(username: string) {
  const part = username.trim().split(/\s+/)[0];
  return part || username;
}

const STATUS_STYLE: Record<BookingStatus, string> = {
  pending: "bg-amber-50 text-amber-800 border-amber-200",
  confirmed: "bg-emerald-50 text-emerald-800 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  completed: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function UserDashboard({ user }: { user: AuthUser }) {
  const firstName = displayFirstName(user.username);
  const [bookings, setBookings] = useState<BookingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [editingBooking, setEditingBooking] = useState<BookingDTO | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "past">("all");

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

  const displayedBookings = useMemo(() => {
    if (activeTab === "upcoming") return upcoming;
    if (activeTab === "past") return past;
    return bookings;
  }, [activeTab, upcoming, past, bookings]);

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
      // no-op
    } finally {
      setPendingId(null);
    }
  }

  return (
    <AccountShell user={user} title="My Dashboard">
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Welcome back, {firstName}
          </h2>
          <p className="text-slate-500 mt-1">
            Track your trip requests, bookings, and custom travel requests.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Header & Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-100 pb-4">
              <h3 className="text-xl font-bold text-slate-900">My Bookings</h3>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeTab === "all"
                      ? "bg-teal-800 text-white shadow-sm"
                      : "bg-white text-slate-600 border border-emerald-100 hover:bg-emerald-50"
                  }`}
                >
                  All ({bookings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("upcoming")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeTab === "upcoming"
                      ? "bg-teal-800 text-white shadow-sm"
                      : "bg-white text-slate-600 border border-emerald-100 hover:bg-emerald-50"
                  }`}
                >
                  Upcoming ({upcoming.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("past")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeTab === "past"
                      ? "bg-teal-800 text-white shadow-sm"
                      : "bg-white text-slate-600 border border-emerald-100 hover:bg-emerald-50"
                  }`}
                >
                  Previous / Past ({past.length})
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-t-transparent" />
              </div>
            ) : displayedBookings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-emerald-200 bg-white px-6 py-12 text-center text-slate-500">
                <p className="text-sm font-semibold text-slate-700">
                  {activeTab === "past"
                    ? "No previous or completed bookings found."
                    : activeTab === "upcoming"
                    ? "No upcoming bookings found."
                    : "No bookings found yet."}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Book a package to start planning your next journey with us.
                </p>
                <Link
                  href="/tours"
                  className="mt-4 inline-block rounded-xl bg-teal-800 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-900"
                >
                  Browse Packages
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedBookings.map((b) => (
                  <BookingRow
                    key={b.id}
                    booking={b}
                    onCancel={() => void cancelBooking(b.id)}
                    cancelling={pendingId === b.id}
                    onEdit={() => setEditingBooking(b)}
                  />
                ))}
              </div>
            )}
          </div>

          {editingBooking && (
            <EditBookingModal
              booking={editingBooking}
              onClose={() => setEditingBooking(null)}
              onSave={() => void loadBookings()}
            />
          )}

          {/* Right Sidebar: Summary Stats */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-emerald-100 p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4">Bookings Overview</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-emerald-50/70 p-3 border border-emerald-100">
                  <p className="text-xl font-extrabold text-teal-900">{bookings.length}</p>
                  <p className="text-[11px] font-semibold text-teal-800 mt-0.5">Total</p>
                </div>
                <div className="rounded-xl bg-teal-50/70 p-3 border border-teal-100">
                  <p className="text-xl font-extrabold text-teal-900">{upcoming.length}</p>
                  <p className="text-[11px] font-semibold text-teal-800 mt-0.5">Upcoming</p>
                </div>
                <div className="rounded-xl bg-amber-50/70 p-3 border border-amber-100">
                  <p className="text-xl font-extrabold text-amber-900">{past.length}</p>
                  <p className="text-[11px] font-semibold text-amber-800 mt-0.5">Past</p>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Quick Actions
                </p>
                <Link
                  href="/tours"
                  className="flex items-center justify-between rounded-xl border border-emerald-100 bg-[#f4fbf8] p-3 text-xs font-semibold text-teal-900 hover:bg-emerald-100/60 transition-colors"
                >
                  <span>Explore All Tour Packages</span>
                  <span>&rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AccountShell>
  );
}

function BookingRow({
  booking,
  onCancel,
  cancelling,
  onEdit,
}: {
  booking: BookingDTO;
  onCancel: () => void;
  cancelling: boolean;
  onEdit?: () => void;
}) {
  const days = travelDateDaysFromLocalToday(booking.travelDate);
  return (
    <div className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700 shrink-0">
            <CalendarDays size={22} />
          </div>
          <div>
            <h4 className="font-bold text-slate-900">{booking.package?.title || "Tour Request"}</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Travel Date: <span className="font-medium text-slate-700">{formatTravelDate(booking.travelDate)}</span>
              {days !== null && days >= 0 ? (
                <span className="ml-1.5 text-teal-600 font-medium">({days === 0 ? "Today" : `in ${days} days`})</span>
              ) : days !== null && days < 0 ? (
                <span className="ml-1.5 text-slate-400 font-medium">(Completed / Passed)</span>
              ) : null}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLE[booking.status]}`}>
            {BOOKING_STATUS_LABEL[booking.status]}
          </span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
            booking.paymentStatus === "paid" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-slate-50 text-slate-600 border-slate-200"
          }`}>
            {PAYMENT_STATUS_LABEL[booking.paymentStatus]}
          </span>
        </div>
      </div>

      <BookingTimeline booking={booking} />

      {booking.package?.tourGuide && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-teal-100 bg-[#f4fbf8] p-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            {booking.package.tourGuide.profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={booking.package.tourGuide.profileImage}
                alt={booking.package.tourGuide.name}
                className="h-8 w-8 rounded-full object-cover border border-emerald-100 shrink-0"
              />
            ) : (
              <div className="h-8 w-8 shrink-0 rounded-full bg-teal-100 flex items-center justify-center text-teal-800 font-bold text-xs">
                {booking.package.tourGuide.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block">
                Assigned Tour Guide
              </span>
              <p className="font-bold text-slate-900 truncate">
                {booking.package.tourGuide.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`mailto:${booking.package.tourGuide.email}`}
              className="inline-flex items-center gap-1 rounded-lg border border-teal-200 bg-white px-2.5 py-1 text-xs font-semibold text-teal-800 hover:bg-teal-50 transition-colors"
            >
              <Mail size={12} /> Contact Guide
            </a>
          </div>
        </div>
      )}

      <PackageAnnouncements packageId={booking.packageId} />

      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm">
          <span className="text-slate-500">Total Price: </span>
          <span className="font-bold text-slate-900">{formatBdt(booking.totalPriceBdt)}</span>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {booking.package && (
            <Link
              href={`/tours/${booking.package.id}`}
              className="rounded-lg border border-emerald-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-[#f4fbf8]"
            >
              View tour
            </Link>
          )}
          {(booking.status === "confirmed" || booking.status === "completed" || booking.paymentStatus === "paid" || booking.paymentStatus === "advance_due") && (
            <a
              href={`/api/bookings/${booking.id}/payslip`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-100 transition-colors shadow-2xs cursor-pointer"
            >
              <Download size={13} /> Download Payslip
            </a>
          )}
          {(booking.status === "pending" || booking.status === "confirmed") && (
            <>
              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100 transition-colors cursor-pointer"
                >
                  Edit Booking
                </button>
              )}
              <button
                type="button"
                disabled={cancelling}
                onClick={onCancel}
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60 cursor-pointer"
              >
                {cancelling ? "Cancelling…" : "Cancel"}
              </button>
            </>
          )}
          {(booking.status === "completed" || (booking.status !== "cancelled" && travelDateIsBeforeLocalToday(booking.travelDate))) && (
            <ReviewPrompt booking={booking} />
          )}
        </div>
      </div>
    </div>
  );
}

function BookingCard({
  booking,
  onCancel,
  cancelling,
  onEdit,
  isNext = false,
}: {
  booking: BookingDTO;
  onCancel: () => void;
  cancelling: boolean;
  onEdit?: () => void;
  isNext?: boolean;
}) {
  const days = travelDateDaysFromLocalToday(booking.travelDate);

  return (
    <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-shadow">
      <div className="relative md:w-80 shrink-0 aspect-[16/10] md:aspect-auto bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={booking.package?.imageUrl || "/placeholder.jpg"}
          alt=""
          className="w-full h-full object-cover"
        />
        {isNext && (
          <span className="absolute left-4 top-4 px-3 py-1 rounded-full text-xs font-bold bg-teal-700 text-white shadow-sm">
            Next Trip
          </span>
        )}
      </div>

      <div className="flex-1 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-teal-700">
                {booking.package?.location} · {booking.package?.duration}
              </p>
              <h3 className="text-2xl font-bold mt-1 text-slate-900">
                {booking.package?.title ?? "Tour"}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLE[booking.status]}`}>
                {BOOKING_STATUS_LABEL[booking.status]}
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 grid-cols-2 text-sm text-slate-600">
            <div>
              <p className="text-xs text-slate-400">Departure date</p>
              <p className="font-semibold text-slate-800 mt-0.5">
                {formatTravelDate(booking.travelDate)}
              </p>
              {days !== null && days >= 0 && (
                <p className="text-xs text-teal-700 font-medium mt-0.5">
                  ({days === 0 ? "Today!" : `in ${days} days`})
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-slate-400">Total travelers</p>
              <p className="font-semibold text-slate-800 mt-0.5">
                {booking.travelers} traveler{booking.travelers === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          {booking.package?.tourGuide && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-teal-100 bg-[#f4fbf8] p-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                {booking.package.tourGuide.profileImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={booking.package.tourGuide.profileImage}
                    alt={booking.package.tourGuide.name}
                    className="h-8 w-8 rounded-full object-cover border border-emerald-100 shrink-0"
                  />
                ) : (
                  <div className="h-8 w-8 shrink-0 rounded-full bg-teal-100 flex items-center justify-center text-teal-800 font-bold text-xs">
                    {booking.package.tourGuide.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block">
                    Assigned Tour Guide
                  </span>
                  <p className="font-bold text-slate-900 truncate">
                    {booking.package.tourGuide.name}
                  </p>
                </div>
              </div>
              <a
                href={`mailto:${booking.package.tourGuide.email}`}
                className="inline-flex items-center gap-1 shrink-0 rounded-lg border border-teal-200 bg-white px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-50 transition-colors"
              >
                <Mail size={12} /> Contact Guide
              </a>
            </div>
          )}

          <PackageAnnouncements packageId={booking.packageId} />
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-slate-400">Amount details</p>
            <p className="font-bold text-lg text-slate-900">{formatBdt(booking.totalPriceBdt)}</p>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            {booking.package && (
              <Link
                href={`/tours/${booking.package.id}`}
                className="rounded-lg border border-emerald-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-[#f4fbf8]"
              >
                View itinerary
              </Link>
            )}
            {(booking.status === "confirmed" || booking.status === "completed" || booking.paymentStatus === "paid" || booking.paymentStatus === "advance_due") && (
              <a
                href={`/api/bookings/${booking.id}/payslip`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-800 hover:bg-teal-100 transition-colors shadow-2xs cursor-pointer"
              >
                <Download size={15} /> Download Payslip
              </a>
            )}
            {booking.status === "pending" && (
              <button
                type="button"
                disabled={cancelling}
                onClick={onCancel}
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60 cursor-pointer"
              >
                {cancelling ? "Cancelling…" : "Cancel Booking"}
              </button>
            )}
            {(booking.status === "completed" || (booking.status !== "cancelled" && travelDateIsBeforeLocalToday(booking.travelDate))) && (
              <ReviewPrompt booking={booking} />
            )}
          </div>
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
        className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100 cursor-pointer"
      >
        Review trip
      </button>
    );
  }

  return (
    <div className="w-full rounded-xl border border-emerald-100 bg-[#f4fbf8] p-3 mt-3">
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
          className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-60 cursor-pointer"
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

function PackageAnnouncements({ packageId }: { packageId: string }) {
  const [announcements, setAnnouncements] = useState<{ id: string; title: string; message: string; createdAt: string; guideName?: string }[]>([]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await fetch(`/api/guide/broadcast?packageId=${packageId}`, { credentials: "include" });
        if (res.ok && active) {
          const data = await res.json();
          setAnnouncements(data.announcements ?? []);
        }
      } catch {}
    })();
    return () => {
      active = false;
    };
  }, [packageId]);

  if (announcements.length === 0) return null;

  return (
    <div className="mt-3 rounded-xl border border-teal-200 bg-teal-50/70 p-3 space-y-2 text-xs">
      <div className="flex items-center gap-1.5 font-bold text-teal-900 uppercase tracking-wider text-[10px]">
        <Megaphone size={13} className="text-teal-700" /> Trip Notices & Announcements ({announcements.length})
      </div>
      <div className="space-y-2">
        {announcements.map((ann) => (
          <div key={ann.id} className="rounded-lg bg-white p-2.5 border border-teal-100 shadow-2xs">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h5 className="font-bold text-slate-900">{ann.title}</h5>
              <span className="text-[10px] text-slate-400">
                {new Date(ann.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <p className="text-slate-600 whitespace-pre-wrap">{ann.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditBookingModal({
  booking,
  onClose,
  onSave,
}: {
  booking: BookingDTO;
  onClose: () => void;
  onSave: () => void;
}) {
  const [travelers, setTravelers] = useState(booking.travelers);
  const [contactPhone, setContactPhone] = useState(booking.contactPhone);
  const [travelerNames, setTravelerNames] = useState((booking.travelerNames ?? []).join("\n"));
  const [emergencyContact, setEmergencyContact] = useState(booking.emergencyContact ?? "");
  const [notes, setNotes] = useState(booking.notes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          travelers,
          contactPhone: contactPhone.trim(),
          travelerNames: travelerNames
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          emergencyContact: emergencyContact.trim(),
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update booking");

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Edit Booking</h3>
            <p className="text-xs text-slate-500">{booking.package?.title ?? "Tour Package"}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">✕</button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Travelers Count
            </span>
            <input
              type="number"
              min={1}
              max={50}
              required
              value={travelers}
              onChange={(e) => setTravelers(Number(e.target.value))}
              className="w-full rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Contact Phone
            </span>
            <input
              type="tel"
              required
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Traveler Names (one per line)
            </span>
            <textarea
              rows={3}
              value={travelerNames}
              onChange={(e) => setTravelerNames(e.target.value)}
              className="w-full rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Emergency Contact
            </span>
            <input
              type="tel"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              className="w-full rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Special Notes
            </span>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500"
            />
          </label>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-teal-700 py-2.5 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-60 cursor-pointer"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
