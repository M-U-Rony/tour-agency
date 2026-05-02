"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AuthUser } from "@/lib/auth-user";
import { clientSignOut } from "@/lib/client-auth";
import {
  LayoutDashboard,
  Map as MapIcon,
  CalendarCheck,
  LogOut,
  Bell,
  TrendingUp,
  MapPin,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import type { BookingDTO, BookingStatus } from "@/lib/booking";
import { BOOKING_STATUS_LABEL, formatTravelDate } from "@/lib/booking";
import { formatBdt, type TourPackageDTO } from "@/lib/tour-package";

const STATUS_STYLE: Record<BookingStatus, string> = {
  pending:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  confirmed:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  cancelled:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
  completed:
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
};

export default function AdminDashboard({ user }: { user: AuthUser }) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const avatarSrc = `https://i.pravatar.cc/150?u=${encodeURIComponent(user.email)}`;

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
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xl tracking-tight">
              <MapPin className="w-6 h-6" />
              <span>ExploreBD Admin</span>
            </div>
            <button
              className="ml-auto lg:hidden text-slate-500"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            <NavItem
              icon={<LayoutDashboard size={20} />}
              label="Dashboard"
              href="/admin/dashboard"
              active
            />
            <NavItem
              icon={<MapIcon size={20} />}
              label="Tours & Packages"
              href="/admin/packages"
            />
            <NavItem
              icon={<CalendarCheck size={20} />}
              label="Bookings"
              href="/admin/bookings"
              badge={
                stats.activeBookings > 0 ? String(stats.activeBookings) : undefined
              }
            />
          </nav>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              className="flex items-center gap-3 w-full px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
              onClick={() => void clientSignOut(router)}
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-slate-500 hover:text-slate-900 dark:hover:text-white"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold tracking-tight hidden sm:block">
              Admin overview
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
              <Bell className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 cursor-pointer pl-2 hover:opacity-80 transition-opacity">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarSrc}
                alt=""
                className="w-9 h-9 rounded-full object-cover border-2 border-slate-200 dark:border-slate-800 shadow-sm"
              />
              <div className="hidden md:block text-sm">
                <p className="font-medium">{user.username}</p>
                <p className="text-xs text-slate-500">Administrator</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                  <h2 className="font-semibold text-lg">Recent bookings</h2>
                  <Link
                    href="/admin/bookings"
                    className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                  >
                    View all
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                    </div>
                  ) : recent.length === 0 ? (
                    <p className="py-12 text-center text-sm text-slate-500">
                      No bookings yet.
                    </p>
                  ) : (
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/20 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="px-6 py-4 font-medium">Customer</th>
                          <th className="px-6 py-4 font-medium">Package</th>
                          <th className="px-6 py-4 font-medium">Date</th>
                          <th className="px-6 py-4 font-medium">Status</th>
                          <th className="px-6 py-4 font-medium text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {recent.map((b) => (
                          <tr
                            key={b.id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <p className="font-medium">{b.user?.username ?? "—"}</p>
                              <p className="text-xs text-slate-500">{b.user?.email ?? ""}</p>
                            </td>
                            <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                              {b.package?.title ?? "—"}
                            </td>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                              {formatTravelDate(b.travelDate)}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLE[b.status]}`}
                              >
                                {BOOKING_STATUS_LABEL[b.status]}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-medium">
                              {formatBdt(b.totalPriceBdt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                  <h2 className="font-semibold text-lg">Top destinations</h2>
                </div>
                <div className="p-6 space-y-4 flex-1">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                    </div>
                  ) : topDestinations.length === 0 ? (
                    <p className="text-sm text-slate-500">No destinations yet.</p>
                  ) : (
                    topDestinations.map((dest) => (
                      <div key={dest.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
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
                <div className="mt-auto p-4 border-t border-slate-200 dark:border-slate-800">
                  <Link
                    href="/admin/packages"
                    className="block w-full py-2 text-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors"
                  >
                    Manage packages
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
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
      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
  }`;
  const content = (
    <>
      <div className="flex items-center gap-3 font-medium text-sm">
        <span
          className={`${
            active
              ? "text-white"
              : "text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors"
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
              ? "bg-white/20 text-white"
              : "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400"
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
        {content}
      </Link>
    );
  }
  return (
    <a href="#" className={className}>
      {content}
    </a>
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
    <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-linear-to-br from-indigo-500/5 to-purple-500/5 rounded-full dark:from-indigo-500/10 dark:to-purple-500/5 group-hover:scale-110 transition-transform duration-500" />

      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
      </div>

      {helper && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <span className="flex items-center gap-1 font-medium px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
            <TrendingUp size={14} />
            Live
          </span>
          <span className="text-slate-400 dark:text-slate-500 text-xs">{helper}</span>
        </div>
      )}
    </div>
  );
}
