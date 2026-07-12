"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AccountPage from "@/components/account-page";
import { ClipboardList } from "lucide-react";
import {
  CUSTOM_TRIP_STATUS_LABEL,
  type CustomTripRequestDTO,
  type CustomTripStatus,
} from "@/lib/custom-trip";
import { formatTravelDate } from "@/lib/booking";

const STATUS_STYLE: Record<CustomTripStatus, string> = {
  new: "border-amber-200 bg-amber-50 text-amber-800",
  contacted: "border-teal-200 bg-teal-50 text-teal-800",
  quoted: "border-emerald-200 bg-emerald-50 text-emerald-800",
  closed: "border-slate-200 bg-slate-100 text-slate-700",
};

export default function AdminCustomTripsPage() {
  const [requests, setRequests] = useState<CustomTripRequestDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/custom-trips", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { requests: CustomTripRequestDTO[] };
      setRequests(data.requests ?? []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const openCount = useMemo(
    () => requests.filter((r) => r.status !== "closed").length,
    [requests]
  );

  async function updateRequest(
    id: string,
    payload: { status?: CustomTripStatus; adminNotes?: string }
  ) {
    setPendingId(id);
    try {
      const res = await fetch(`/api/custom-trips/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed");
      await loadRequests();
    } finally {
      setPendingId(null);
    }
  }

  return (
    <AccountPage title="Custom Trips" requireRole="admin" wide>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="inline-flex items-center gap-2 text-xl font-bold text-slate-900">
            <ClipboardList size={20} /> Request queue
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {openCount} open custom trip request{openCount === 1 ? "" : "s"}.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadRequests()}
          className="rounded-lg border border-emerald-100 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-[#f4fbf8]"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-t-transparent" />
        </div>
      ) : requests.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-emerald-200 bg-white px-6 py-14 text-center text-sm text-slate-500">
          No custom trip requests yet.
        </p>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              disabled={pendingId === request.id}
              onUpdate={(payload) => void updateRequest(request.id, payload)}
            />
          ))}
        </div>
      )}
    </AccountPage>
  );
}

function RequestCard({
  request,
  disabled,
  onUpdate,
}: {
  request: CustomTripRequestDTO;
  disabled: boolean;
  onUpdate: (payload: { status?: CustomTripStatus; adminNotes?: string }) => void;
}) {
  return (
    <article className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 lg:flex-row">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">{request.destination}</h3>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[request.status]}`}
            >
              {CUSTOM_TRIP_STATUS_LABEL[request.status]}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {request.tripType} / {request.budget}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            {formatTravelDate(request.departureDate)} - {formatTravelDate(request.returnDate)} for{" "}
            {request.travelers} adult{request.travelers === 1 ? "" : "s"}
            {request.children ? ` and ${request.children} children` : ""}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {request.name} / {request.phone} / {request.email}
          </p>
          {request.notes && (
            <p className="mt-3 rounded-xl bg-[#f4fbf8] p-3 text-sm leading-6 text-slate-700">
              {request.notes}
            </p>
          )}
        </div>
        <div className="w-full space-y-3 lg:w-72">
          <select
            value={request.status}
            disabled={disabled}
            onChange={(e) => onUpdate({ status: e.target.value as CustomTripStatus })}
            className="w-full rounded-xl border border-emerald-100 bg-[#f4fbf8] px-3 py-2 text-sm font-semibold text-slate-700"
          >
            {Object.entries(CUSTOM_TRIP_STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <textarea
            defaultValue={request.adminNotes}
            key={`${request.id}-${request.adminNotes}`}
            disabled={disabled}
            onBlur={(e) => {
              const adminNotes = e.currentTarget.value;
              if (adminNotes !== request.adminNotes) onUpdate({ adminNotes });
            }}
            rows={4}
            placeholder="Internal notes"
            className="w-full resize-y rounded-xl border border-emerald-100 bg-[#f4fbf8] px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500"
          />
        </div>
      </div>
    </article>
  );
}
