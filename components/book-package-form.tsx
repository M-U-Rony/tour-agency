"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Phone, Users, MessageSquare, CheckCircle, Heart } from "lucide-react";
import { formatBdt, isTourUpcoming } from "@/lib/tour-package";
import { travelDateInputMinLocal } from "@/lib/booking";

type Props = {
  packageId: string;
  pricePerPerson: number;
  isAuthenticated: boolean;
  totalSeats?: number;
  availableSeats?: number;
  startDate?: string;
  endDate?: string;
  availableDates?: string[];
  /** Admins preview listing pricing only; customer booking requests are disabled. */
  adminPreview?: boolean;
  /** Tour guides view listing pricing only; customer booking requests are disabled. */
  guidePreview?: boolean;
};

export default function BookPackageForm({
  packageId,
  pricePerPerson,
  isAuthenticated,
  totalSeats = 20,
  availableSeats = 20,
  startDate,
  endDate,
  availableDates = [],
  adminPreview = false,
  guidePreview = false,
}: Props) {
  const router = useRouter();
  const initialDate = startDate || (availableDates.length > 0 ? availableDates[0] : "");
  const [travelDate, setTravelDate] = useState(initialDate);
  const [travelers, setTravelers] = useState(1);
  const [contactPhone, setContactPhone] = useState("");
  const [travelerNames, setTravelerNames] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<{ id: string; total: number } | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  const [wishlisted, setWishlisted] = useState(false);
  const [togglingWishlist, setTogglingWishlist] = useState(false);
  const [existingBooking, setExistingBooking] = useState<{
    id: string;
    travelers: number;
    status: string;
    travelDate: string;
  } | null>(null);
  const [cancellingActive, setCancellingActive] = useState(false);

  const isPast = useMemo(() => {
    return !isTourUpcoming({
      id: packageId,
      title: "",
      location: "",
      duration: "",
      priceBdt: pricePerPerson,
      rating: 0,
      shortDescription: "",
      imageUrl: "",
      startDate,
      endDate,
      availableDates,
    });
  }, [packageId, pricePerPerson, startDate, endDate, availableDates]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void (async () => {
      try {
        const [wRes, bRes] = await Promise.all([
          fetch("/api/wishlist", { credentials: "include" }),
          fetch("/api/bookings", { credentials: "include" }),
        ]);

        if (wRes.ok) {
          const data = await wRes.json();
          const savedIds: number[] = data.packageIds ?? [];
          if (savedIds.map(String).includes(String(packageId))) {
            setWishlisted(true);
          }
        }

        if (bRes.ok) {
          const bData = await bRes.json();
          const userBookings: any[] = bData.bookings ?? [];
          const active = userBookings.find(
            (b) => String(b.packageId) === String(packageId) && b.status !== "cancelled"
          );
          if (active) {
            setExistingBooking({
              id: String(active.id),
              travelers: active.travelers,
              status: active.status,
              travelDate: active.travelDate,
            });
          }
        }
      } catch {}
    })();
  }, [isAuthenticated, packageId]);

  async function handleCancelActiveBooking() {
    if (!existingBooking) return;
    setCancellingActive(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/bookings/${existingBooking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (res.ok) {
        setMessage({ type: "ok", text: "Booking cancelled successfully." });
        setExistingBooking(null);
      } else {
        const data = await res.json();
        setMessage({ type: "err", text: data.message ?? "Failed to cancel booking." });
      }
    } catch {
      setMessage({ type: "err", text: "Network error." });
    } finally {
      setCancellingActive(false);
    }
  }

  async function handleToggleWishlist() {
    if (!isAuthenticated) {
      router.push(`/signin?next=${encodeURIComponent(`/tours/${packageId}`)}`);
      return;
    }
    if (togglingWishlist) return;
    setTogglingWishlist(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });
      if (res.ok) {
        const data = await res.json();
        setWishlisted(data.wishlisted);
      }
    } catch {} finally {
      setTogglingWishlist(false);
    }
  }

  const isSoldOut = availableSeats <= 0;
  const total = useMemo(
    () => Math.max(0, travelers) * pricePerPerson,
    [travelers, pricePerPerson]
  );
  const minTravelDate = useMemo(() => travelDateInputMinLocal(), []);

  useEffect(() => {
    if (availableDates.length > 0 && !travelDate) {
      setTravelDate(availableDates[0]);
    }
  }, [availableDates, travelDate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (adminPreview) return;

    if (!isAuthenticated) {
      router.push(`/signin?next=${encodeURIComponent(`/tours/${packageId}`)}`);
      return;
    }

    if (travelers > availableSeats) {
      setMessage({
        type: "err",
        text:
          availableSeats <= 0
            ? "This tour package is currently sold out."
            : `Cannot request ${travelers} travelers. Only ${availableSeats} seat(s) remaining.`,
      });
      return;
    }

    setMessage(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          packageId,
          travelDate,
          travelers: Number(travelers),
          contactPhone: contactPhone.trim(),
          travelerNames: travelerNames
            .split("\n")
            .map((name) => name.trim())
            .filter(Boolean),
          emergencyContact: emergencyContact.trim(),
          paymentMethod: paymentMethod.trim(),
          transactionId: transactionId.trim(),
          notes: notes.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Could not create booking");
      }
      setBookingDetails({
        id: data.booking?.id || data.booking?._id || "N/A",
        total: total,
      });
      setTravelDate("");
      setTravelers(2);
      setContactPhone("");
      setTravelerNames("");
      setEmergencyContact("");
      setPaymentMethod("");
      setTransactionId("");
      setNotes("");
      setSubmitted(true);
    } catch (err: unknown) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
    }
  }

  const shellClass =
    "rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm";

  if (submitted && bookingDetails) {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm flex flex-col items-center justify-center text-center py-8 gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle className="h-8 w-8 text-emerald-600" />
        </span>
        <h3 className="text-xl font-bold text-slate-900 font-[Georgia,Times_New_Roman,serif]">
          Booking Request Sent!
        </h3>
        <div className="w-full bg-[#f4fbf8] rounded-xl border border-emerald-100/50 p-4 text-left text-xs space-y-2.5">
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Booking ID:</span>
            <span className="font-semibold text-slate-900 select-all">{bookingDetails.id}</span>
          </div>
          <div className="flex justify-between border-t border-emerald-100/30 pt-2">
            <span className="text-slate-500 font-medium">Total Amount:</span>
            <span className="font-semibold text-teal-800">{formatBdt(bookingDetails.total)}</span>
          </div>
          <div className="flex justify-between border-t border-emerald-100/30 pt-2">
            <span className="text-slate-500 font-medium">Status:</span>
            <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">Pending Review</span>
          </div>
        </div>
        <p className="text-xs text-slate-500 leading-normal max-w-[280px]">
          We are reviewing your request. You can check your booking status inside your dashboard.
        </p>
        <div className="flex flex-col gap-2 w-full mt-2">
          <Link
            href="/dashboard"
            className="w-full text-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 transition cursor-pointer"
          >
            Go to My Bookings
          </Link>
          <button
            onClick={() => setSubmitted(false)}
            className="w-full text-center rounded-xl border border-slate-100 px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (adminPreview) {
    return (
      <div className={shellClass}>
        <div className="mb-5 flex items-baseline justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              From
            </p>
            <p className="text-2xl font-bold text-slate-900">
              {formatBdt(pricePerPerson)}
              <span className="text-sm font-medium text-slate-500"> / person</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Example total (2 guests)
            </p>
            <p className="text-xl font-bold text-teal-800">
              {formatBdt(2 * pricePerPerson)}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-700">
          <p className="font-medium text-slate-900">Admin preview</p>
          <p className="mt-1 text-slate-600">
            Customer booking requests are not available on this account. Manage incoming
            requests from the admin bookings area.
          </p>
          <Link
            href="/admin/bookings"
            className="mt-3 inline-flex text-sm font-semibold text-teal-700 hover:text-teal-800"
          >
            Open bookings
          </Link>
        </div>
      </div>
    );
  }

  if (guidePreview) {
    return (
      <div className={shellClass}>
        <div className="mb-5 flex items-baseline justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              From
            </p>
            <p className="text-2xl font-bold text-slate-900">
              {formatBdt(pricePerPerson)}
              <span className="text-sm font-medium text-slate-500"> / person</span>
            </p>
          </div>
          <span className="rounded-full bg-teal-50 border border-teal-100 px-3 py-1 text-xs font-bold text-teal-800">
            Tour Guide View
          </span>
        </div>
        <div className="rounded-2xl border border-teal-100 bg-[#f4fbf8] p-5 space-y-3 text-slate-700">
          <div className="flex items-center gap-2 font-bold text-teal-800 text-sm">
            <Users size={18} />
            Tour Guide Account
          </div>
          <p className="text-xs leading-relaxed text-slate-600">
            Tour guide accounts cannot submit customer booking requests. Manage your assigned passenger roster and trip tools from your guide dashboard.
          </p>
          <Link
            href="/guide/dashboard"
            className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-800 transition"
          >
            Go to Tour Guide Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (existingBooking) {
    return (
      <div className={shellClass}>
        <div className="mb-5 flex items-baseline justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              From
            </p>
            <p className="text-2xl font-bold text-slate-900">
              {formatBdt(pricePerPerson)}
              <span className="text-sm font-medium text-slate-500"> / person</span>
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
            Booked
          </span>
        </div>

        <div className="rounded-2xl border border-teal-100 bg-[#f4fbf8] p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-800 font-bold">
              <CheckCircle size={20} />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">You already booked this tour</h4>
              <p className="text-xs text-slate-600">
                Status: <span className="font-extrabold capitalize text-teal-800">{existingBooking.status}</span> ({existingBooking.travelers} traveler{existingBooking.travelers > 1 ? "s" : ""})
              </p>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-slate-600">
            You cannot book the same tour package twice. You can view, edit, or cancel your existing booking from your dashboard.
          </p>

          {message && (
            <div
              className={`rounded-lg border px-3 py-2 text-xs font-medium ${
                message.type === "ok"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <Link
              href="/dashboard"
              className="w-full text-center rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-800 transition cursor-pointer"
            >
              View / Edit Booking in Dashboard
            </Link>
            <button
              type="button"
              disabled={cancellingActive}
              onClick={handleCancelActiveBooking}
              className="w-full text-center rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition cursor-pointer disabled:opacity-50"
            >
              {cancellingActive ? "Cancelling..." : "Cancel Existing Booking"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={shellClass}>
        <div className="mb-5 flex items-baseline justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              From
            </p>
            <p className="text-2xl font-bold text-slate-900">
              {formatBdt(pricePerPerson)}
              <span className="text-sm font-medium text-slate-500"> / person</span>
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
              isPast
                ? "bg-slate-100 text-slate-700 border border-slate-200"
                : availableSeats > 0
                ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                : "bg-red-50 text-red-700 border border-red-100"
            }`}
          >
            {isPast ? "Past Tour" : availableSeats > 0 ? `${availableSeats} seats left` : "Sold out"}
          </span>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-[#f4fbf8] p-5 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100/70 text-teal-700">
            <Users size={22} />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">
              {isPast ? "Past Tour (Bookings Closed)" : "Sign in to book this tour"}
            </h4>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              {isPast
                ? "This tour package took place in the past. Bookings for past tours are closed."
                : "You are currently signed out. Sign in or create an account to select travel dates and submit a booking request."}
            </p>
          </div>
          {!isPast && (
            <div className="flex flex-col gap-2 pt-1">
              <Link
                href={`/signin?next=${encodeURIComponent(`/tours/${packageId}`)}`}
                className="w-full text-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 transition cursor-pointer"
              >
                Sign In to Book Tour
              </Link>
              <Link
                href={`/signup?next=${encodeURIComponent(`/tours/${packageId}`)}`}
                className="w-full text-center rounded-xl border border-emerald-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={shellClass}>
      <div className="mb-5 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            From
          </p>
          <p className="text-2xl font-bold text-slate-900">
            {formatBdt(pricePerPerson)}
            <span className="text-sm font-medium text-slate-500"> / person</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!adminPreview && (
            <button
              type="button"
              onClick={handleToggleWishlist}
              title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-100 bg-[#f4fbf8] px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-emerald-50 cursor-pointer"
            >
              <Heart
                size={16}
                className={
                  wishlisted
                    ? "fill-rose-500 text-rose-500"
                    : "text-slate-500 hover:text-rose-500"
                }
              />
              <span>{wishlisted ? "Saved" : "Save"}</span>
            </button>
          )}
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total
            </p>
            <p className="text-xl font-bold text-teal-800">
              {formatBdt(total)}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-5 flex items-center justify-between rounded-xl bg-[#f4fbf8] border border-emerald-100 px-4 py-2.5 text-xs font-medium">
        <span className="text-slate-600">Status:</span>
        {isPast ? (
          <span className="font-extrabold text-slate-700">Past Tour (Bookings Closed)</span>
        ) : isSoldOut ? (
          <span className="font-extrabold text-red-600">Sold Out (0 / {totalSeats})</span>
        ) : (
          <span className="font-bold text-teal-800">{availableSeats} / {totalSeats} seats left</span>
        )}
      </div>

      {isPast && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-100 p-3 text-xs font-semibold text-slate-700">
          This tour package date has passed. Bookings for past tours are disabled.
        </div>
      )}

      {message && (
        <div
          className={`mb-4 rounded-lg border px-3 py-2 text-sm font-medium ${
            message.type === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        <div className="block">
          <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <CalendarDays size={14} /> Fixed Tour Schedule
          </span>
          <div className="w-full rounded-xl border border-emerald-100 bg-[#f4fbf8] p-3 text-xs font-semibold text-teal-900 space-y-1">
            {startDate && (
              <div>
                <span className="text-slate-500 font-medium">Start: </span>
                {new Date(startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </div>
            )}
            {endDate && (
              <div>
                <span className="text-slate-500 font-medium">End: </span>
                {new Date(endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </div>
            )}
          </div>
        </div>

        {availableDates.length > 0 && (
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Select Batch / Date
            </span>
            <select
              value={travelDate}
              disabled={isPast}
              onChange={(e) => setTravelDate(e.target.value)}
              className="w-full rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 cursor-pointer disabled:opacity-60"
            >
              {availableDates.map((d) => (
                <option key={d} value={d}>
                  {new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block">
          <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Users size={14} /> Number of travelers
          </span>
          <input
            required
            type="number"
            min={1}
            max={Math.max(1, availableSeats)}
            disabled={isPast}
            className="w-full rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
            value={travelers}
            onChange={(e) => setTravelers(Number(e.target.value))}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Phone size={14} /> Contact phone
          </span>
          <input
            required
            type="tel"
            disabled={isPast}
            className="w-full rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
            placeholder="+880 17XX XXXXXX"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Users size={14} /> Traveler names
          </span>
          <textarea
            rows={3}
            disabled={isPast}
            className="w-full resize-y rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
            placeholder="One traveler per line"
            value={travelerNames}
            onChange={(e) => setTravelerNames(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Phone size={14} /> Emergency contact
          </span>
          <input
            type="tel"
            disabled={isPast}
            className="w-full rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
            placeholder="Name and phone number"
            value={emergencyContact}
            onChange={(e) => setEmergencyContact(e.target.value)}
          />
        </label>

        <div className="rounded-xl border border-emerald-100 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Manual payment reference
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Optional for now. Add bKash, Nagad, bank, or cash reference details if
            you already paid an advance outside the app.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              disabled={isPast}
              className="rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
              placeholder="Method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <input
              disabled={isPast}
              className="rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
              placeholder="Transaction/reference ID"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
            />
          </div>
        </div>

        <label className="block">
          <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <MessageSquare size={14} /> Notes (optional)
          </span>
          <textarea
            rows={3}
            disabled={isPast}
            className="w-full resize-y rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
            placeholder="Any special requirements?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>

        <button
          type="submit"
          disabled={submitting || isSoldOut || travelers > availableSeats || isPast}
          className={`w-full rounded-xl py-3 text-sm font-semibold text-white shadow-md transition-colors ${
            isPast || isSoldOut || travelers > availableSeats
              ? "bg-slate-500 hover:bg-slate-600 cursor-not-allowed"
              : "bg-teal-700 hover:bg-teal-800 shadow-teal-900/20 cursor-pointer"
          } disabled:opacity-60`}
        >
          {isPast
            ? "Past Tour (Bookings Closed)"
            : isSoldOut
            ? "Sold Out"
            : travelers > availableSeats
            ? `Exceeds Available Seats (${availableSeats} max)`
            : submitting
            ? "Submitting..."
            : isAuthenticated
            ? "Request Booking"
            : "Sign in to book"}
        </button>
        <p className="text-center text-xs text-slate-500">
          Booking is a request. Choose today or a future date and our team will confirm
          availability shortly.
        </p>
      </div>
    </form>
  );
}
