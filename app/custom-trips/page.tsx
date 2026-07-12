"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AccountPage from "@/components/account-page";
import type { CustomTripRequestDTO } from "@/lib/custom-trip";
import { CUSTOM_TRIP_STATUS_LABEL } from "@/lib/custom-trip";
import { formatTravelDate } from "@/lib/booking";
import { Clock } from "lucide-react";

export default function MyCustomTripsPage() {
  const [requests, setRequests] = useState<CustomTripRequestDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const res = await fetch("/api/custom-trips/me", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load requests");
        const data = (await res.json()) as { requests?: CustomTripRequestDTO[] };
        setRequests(data.requests ?? []);
      } catch {
        setError("Could not load your custom trip requests.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openCount = useMemo(
    () => requests.filter((r) => r.status !== "closed").length,
    [requests]
  );

  return (
    <AccountPage
      title="My Custom Trips"
      requireRole="user"
      redirectTo="/admin/custom-trips"
      actions={
        <Link
          href="/contact"
          className="inline-flex items-center justify-center rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-800"
        >
          Request another
        </Link>
      }
    >
      <div className="mb-6">
        <h2 className="inline-flex items-center gap-2 text-xl font-bold text-slate-900">
          <Clock size={20} /> Request status
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {openCount} open custom trip request{openCount === 1 ? "" : "s"}.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-t-transparent" />
        </div>
      ) : error ? (
        <p className="rounded-2xl border border-red-200 bg-white px-6 py-10 text-center text-sm text-red-700">
          {error}
        </p>
      ) : requests.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-emerald-200 bg-white px-6 py-14 text-center text-sm text-slate-500">
          You haven&apos;t submitted any custom trip requests yet.{" "}
          <Link href="/contact" className="font-semibold text-teal-700 hover:text-teal-800">
            Request one now
          </Link>
          .
        </p>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <article
              key={request.id}
              className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-4 lg:flex-row">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{request.destination}</h3>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                      {CUSTOM_TRIP_STATUS_LABEL[request.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {request.tripType} / {request.budget}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    {formatTravelDate(request.departureDate)} - {formatTravelDate(request.returnDate)}{" "}
                    for {request.travelers} adult{request.travelers === 1 ? "" : "s"}
                    {request.children ? ` and ${request.children} children` : ""}
                  </p>
                  {request.notes ? (
                    <p className="mt-2 text-sm text-slate-600">{request.notes}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-slate-500">
                    Submitted: {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="lg:w-72">
                  <div className="rounded-xl border border-emerald-100 bg-[#f4fbf8] p-3">
                    <p className="text-xs font-semibold text-slate-700">Contact</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {request.name} · {request.phone} · {request.email}
                    </p>
                    {request.adminNotes ? (
                      <p className="mt-3 text-sm text-slate-600">Note: {request.adminNotes}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </AccountPage>
  );
}
