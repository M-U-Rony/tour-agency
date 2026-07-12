"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AccountPage from "@/components/account-page";
import { CalendarCheck } from "lucide-react";
import type { BookingDTO, BookingStatus, PaymentStatus } from "@/lib/booking";
import {
  BOOKING_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  formatTravelDate,
} from "@/lib/booking";
import { formatBdt } from "@/lib/tour-package";

const STATUS_STYLE: Record<BookingStatus, string> = {
  pending: "bg-amber-50 text-amber-800 border-amber-200",
  confirmed: "bg-emerald-50 text-emerald-800 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  completed: "bg-slate-100 text-slate-700 border-slate-200",
};

const FILTERS: { id: "all" | BookingStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

export default function AdminBookingsPage() {
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
    void loadBookings();
  }, [loadBookings]);

  const filtered = useMemo(() => {
    if (filter === "all") return bookings;
    return bookings.filter((b) => b.status === filter);
  }, [bookings, filter]);

  async function setStatus(id: string, status: BookingStatus) {
    await updateBooking(id, { status });
  }

  async function updateBooking(
    id: string,
    payload: {
      status?: BookingStatus;
      paymentStatus?: PaymentStatus;
      paymentMethod?: string;
      transactionId?: string;
      adminNotes?: string;
    }
  ) {
    setPendingId(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed");
      await loadBookings();
    } catch {
      // no-op for MVP
    } finally {
      setPendingId(null);
    }
  }

  return (
    <AccountPage title="Bookings" requireRole="admin" wide>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="inline-flex items-center gap-2 text-xl font-bold text-slate-900">
          <CalendarCheck size={20} /> All bookings
        </h2>
        <button
          type="button"
          onClick={() => void loadBookings()}
          className="rounded-lg border border-emerald-100 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-[#f4fbf8]"
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
                ? "border-teal-200 bg-teal-50 text-teal-900"
                : "border-emerald-100 bg-white text-slate-700 hover:bg-[#f4fbf8]"
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
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-emerald-200 bg-white px-6 py-14 text-center text-sm text-slate-500">
          No bookings to display.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-emerald-100 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-emerald-100">
            <thead className="bg-[#f4fbf8]">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Package</th>
                <th className="px-5 py-3">Travel date</th>
                <th className="px-5 py-3">Travelers</th>
                <th className="px-5 py-3 text-right">Total</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-100 text-sm">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-[#f4fbf8]/60">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">{b.user?.username ?? "-"}</p>
                    <p className="text-xs text-slate-500">{b.user?.email ?? ""}</p>
                    <p className="text-xs text-slate-500">{b.contactPhone}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-900">{b.package?.title ?? "-"}</p>
                    <p className="text-xs text-slate-500">
                      {b.package?.location} / {b.package?.duration}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-slate-700">{formatTravelDate(b.travelDate)}</td>
                  <td className="px-5 py-4 text-slate-700">{b.travelers}</td>
                  <td className="px-5 py-4 text-right font-semibold text-slate-900">
                    {formatBdt(b.totalPriceBdt)}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[b.status]}`}
                    >
                      {BOOKING_STATUS_LABEL[b.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <PaymentEditor
                      booking={b}
                      disabled={pendingId === b.id}
                      onSave={(payload) => void updateBooking(b.id, payload)}
                    />
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
    </AccountPage>
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
      ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
      : tone === "complete"
        ? "border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100"
        : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100";
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

function PaymentEditor({
  booking,
  disabled,
  onSave,
}: {
  booking: BookingDTO;
  disabled: boolean;
  onSave: (payload: {
    paymentStatus?: PaymentStatus;
    paymentMethod?: string;
    transactionId?: string;
    adminNotes?: string;
  }) => void;
}) {
  return (
    <div className="min-w-48 space-y-2">
      <select
        defaultValue={booking.paymentStatus}
        key={`${booking.id}-${booking.paymentStatus}`}
        disabled={disabled}
        onChange={(e) => {
          const value = e.target.value as PaymentStatus;
          onSave({ paymentStatus: value });
        }}
        className="w-full rounded-lg border border-emerald-100 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700"
      >
        {Object.entries(PAYMENT_STATUS_LABEL).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      {(booking.paymentMethod || booking.transactionId) && (
        <p className="text-xs leading-5 text-slate-500">
          {booking.paymentMethod || "Payment"} {booking.transactionId}
        </p>
      )}
      <textarea
        defaultValue={booking.adminNotes}
        key={`${booking.id}-${booking.adminNotes}`}
        disabled={disabled}
        onBlur={(e) => {
          const adminNotes = e.currentTarget.value;
          if (adminNotes !== booking.adminNotes) onSave({ adminNotes });
        }}
        rows={2}
        placeholder="Internal note"
        className="w-full resize-y rounded-lg border border-emerald-100 bg-[#f4fbf8] px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-emerald-500"
      />
    </div>
  );
}
