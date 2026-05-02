"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Phone, Users, MessageSquare } from "lucide-react";
import { formatBdt } from "@/lib/tour-package";
import { travelDateInputMinLocal } from "@/lib/booking";

type Props = {
  packageId: string;
  pricePerPerson: number;
  isAuthenticated: boolean;
  /** Admins preview listing pricing only; customer booking requests are disabled. */
  adminPreview?: boolean;
};

export default function BookPackageForm({
  packageId,
  pricePerPerson,
  isAuthenticated,
  adminPreview = false,
}: Props) {
  const router = useRouter();
  const [travelDate, setTravelDate] = useState("");
  const [travelers, setTravelers] = useState(2);
  const [contactPhone, setContactPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  const total = useMemo(
    () => Math.max(0, travelers) * pricePerPerson,
    [travelers, pricePerPerson]
  );
  const minTravelDate = useMemo(() => travelDateInputMinLocal(), []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (adminPreview) return;

    if (!isAuthenticated) {
      router.push(`/signin?next=${encodeURIComponent(`/tours/${packageId}`)}`);
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
          notes: notes.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Could not create booking");
      }
      setTravelDate("");
      setTravelers(2);
      setContactPhone("");
      setNotes("");
      setMessage({
        type: "ok",
        text: "Booking submitted. You can track it in your dashboard.",
      });
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch (err: unknown) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const shellClass =
    "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950";

  if (adminPreview) {
    return (
      <div className={shellClass}>
        <div className="mb-5 flex items-baseline justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              From
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatBdt(pricePerPerson)}
              <span className="text-sm font-medium text-slate-500"> / person</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Example total (2 guests)
            </p>
            <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
              {formatBdt(2 * pricePerPerson)}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          <p className="font-medium text-slate-900 dark:text-white">Admin preview</p>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Customer booking requests are not available on this account. Manage incoming
            requests from the admin bookings area.
          </p>
          <Link
            href="/admin/bookings"
            className="mt-3 inline-flex text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Open bookings →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={shellClass}>
      <div className="mb-5 flex items-baseline justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            From
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatBdt(pricePerPerson)}
            <span className="text-sm font-medium text-slate-500"> / person</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total
          </p>
          <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
            {formatBdt(total)}
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`mb-4 rounded-lg border px-3 py-2 text-sm font-medium ${
            message.type === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <CalendarDays size={14} /> Travel date
          </span>
          <input
            required
            type="date"
            min={minTravelDate}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-[box-shadow,border-color] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            value={travelDate}
            onChange={(e) => setTravelDate(e.target.value)}
            onClick={(e) => {
              const el = e.currentTarget as HTMLInputElement & {
                showPicker?: () => void;
              };
              try {
                el.showPicker?.();
              } catch {
                // ignore: some browsers block programmatic opening
              }
            }}
            onFocus={(e) => {
              const el = e.currentTarget as HTMLInputElement & {
                showPicker?: () => void;
              };
              try {
                el.showPicker?.();
              } catch {
                // ignore
              }
            }}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Users size={14} /> Travelers
          </span>
          <input
            required
            type="number"
            min={1}
            max={50}
            step={1}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
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
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            placeholder="+880 17XX XXXXXX"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <MessageSquare size={14} /> Notes (optional)
          </span>
          <textarea
            rows={3}
            className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            placeholder="Any special requirements?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 transition-colors hover:bg-indigo-700 disabled:opacity-60 dark:hover:bg-indigo-500"
        >
          {submitting
            ? "Submitting…"
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
