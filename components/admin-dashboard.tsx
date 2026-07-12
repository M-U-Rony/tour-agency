"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, TrendingUp } from "lucide-react";
import type { AuthUser } from "@/lib/auth-user";
import type { BookingDTO, BookingStatus } from "@/lib/booking";
import { BOOKING_STATUS_LABEL } from "@/lib/booking";
import { formatBdt, type TourPackageDTO } from "@/lib/tour-package";
import AccountShell from "@/components/account-shell";

const STATUS_STYLE: Record<BookingStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  completed: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function AdminDashboard({ user }: { user: AuthUser }) {
  const [bookings, setBookings] = useState<BookingDTO[]>([]);
  const [packages, setPackages] = useState<TourPackageDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [bRes, pRes] = await Promise.all([
          fetch("/api/bookings?all=true", { credentials: "include" }),
          fetch("/api/tour-packages"),
        ]);
        const bData = bRes.ok ? ((await bRes.json()) as { bookings: BookingDTO[] }) : { bookings: [] };
        const pData = pRes.ok
          ? ((await pRes.json()) as { packages: TourPackageDTO[] })
          : { packages: [] };
        if (!cancelled) {
          setBookings(bData.bookings ?? []);
          setPackages(pData.packages ?? []);
        }
      } catch {
        if (!cancelled) {
          setBookings([]);
          setPackages([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const totalRevenue = bookings
      .filter((b) => b.status === "confirmed" || b.status === "completed")
      .reduce((sum, b) => sum + b.totalPriceBdt, 0);
    const activeBookings = bookings.filter(
      (b) => b.status === "pending" || b.status === "confirmed"
    ).length;
    const customers = new Set(bookings.map((b) => b.userId)).size;
    return {
      totalRevenue,
      activeBookings,
      totalTours: packages.length,
      customers,
    };
  }, [bookings, packages]);

  const recent = useMemo(() => bookings.slice(0, 6), [bookings]);

  const topDestinations = useMemo(() => {
    const counts = new Map<string, { name: string; bookings: number }>();
    for (const b of bookings) {
      const name = b.package?.location ?? "Unknown";
      const cur = counts.get(name) ?? { name, bookings: 0 };
      cur.bookings += 1;
      counts.set(name, cur);
    }
    return Array.from(counts.values())
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5);
  }, [bookings]);

  return (
    <AccountShell user={user} title="Admin Dashboard">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-slate-500 mt-1">
            Live data from your bookings and packages.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Revenue"
            value={loading ? "—" : formatBdt(stats.totalRevenue)}
            helper="Confirmed + completed bookings"
          />
          <MetricCard
            title="Active Bookings"
            value={loading ? "—" : String(stats.activeBookings)}
            helper="Pending + confirmed"
          />
          <MetricCard
            title="Total Tours"
            value={loading ? "—" : String(stats.totalTours)}
            helper="Live packages"
          />
          <MetricCard
            title="Customers"
            value={loading ? "—" : String(stats.customers)}
            helper="Unique booking accounts"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-emerald-100 flex justify-between items-center bg-[#f4fbf8]/50">
              <h2 className="font-semibold text-lg">Recent bookings</h2>
              <Link
                href="/admin/bookings"
                className="text-sm font-semibold text-teal-700 hover:text-teal-800 transition-colors"
              >
                View all
              </Link>
            </div>
            <div className="flex-1 overflow-x-auto">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-t-transparent" />
                </div>
              ) : recent.length === 0 ? (
                <p className="text-center py-12 text-sm text-slate-500">No bookings yet.</p>
              ) : (
                <table className="w-full text-left text-sm text-slate-600 border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-3 font-semibold">User</th>
                      <th className="px-6 py-3 font-semibold">Tour</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 font-semibold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recent.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">{b.user?.username || "Traveler"}</p>
                          <p className="text-xs text-slate-400">{b.user?.email || "—"}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-900 line-clamp-1">
                            {b.package?.title || "—"}
                          </p>
                          <p className="text-xs text-slate-400">
                            {b.travelers} traveler{b.travelers === 1 ? "" : "s"}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLE[b.status]}`}
                          >
                            {BOOKING_STATUS_LABEL[b.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-slate-900">
                          {formatBdt(b.totalPriceBdt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm flex flex-col">
            <div className="p-6 border-b border-emerald-100 flex justify-between items-center bg-[#f4fbf8]/50">
              <h2 className="font-semibold text-lg">Top destinations</h2>
            </div>
            <div className="p-6 space-y-4 flex-1">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-700 border-t-transparent" />
                </div>
              ) : topDestinations.length === 0 ? (
                <p className="text-sm text-slate-500">No destinations yet.</p>
              ) : (
                topDestinations.map((dest) => (
                  <div key={dest.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <MapPin size={18} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{dest.name}</p>
                        <p className="text-xs text-slate-500">
                          {dest.bookings} booking{dest.bookings === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-auto p-4 border-t border-emerald-100">
              <Link
                href="/admin/packages"
                className="block w-full py-2 text-center text-sm font-medium text-teal-700 hover:bg-[#f4fbf8] rounded-lg transition-colors"
              >
                Manage packages
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AccountShell>
  );
}

function MetricCard({
  title,
  value,
  helper,
}: {
  title: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-linear-to-br from-teal-500/5 to-emerald-500/5 rounded-full group-hover:scale-110 transition-transform duration-500" />

      <p className="text-sm font-medium text-slate-500">{title}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
      </div>

      {helper && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <span className="flex items-center gap-1 font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
            <TrendingUp size={14} />
            Live
          </span>
          <span className="text-slate-400 text-xs">{helper}</span>
        </div>
      )}
    </div>
  );
}
