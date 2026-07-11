"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { AuthUser } from "@/lib/auth-user";
import { clientSignOut } from "@/lib/client-auth";
import { getUserAvatarUrl } from "@/lib/user-avatar";
import {
  Bell,
  CalendarCheck,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Compass,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  MapPin,
  Menu,
  Plane,
  User,
  X,
} from "lucide-react";

type NavLink = {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: string;
};

function ShellNavItem({
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
  href: string;
}) {
  const className = `flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
    active
      ? "bg-teal-50 text-teal-900 font-semibold"
      : "text-slate-600 hover:bg-emerald-50 hover:text-slate-900"
  }`;

  return (
    <Link href={href} className={className}>
      <div className="flex items-center gap-3 font-medium text-sm">
        <span
          className={
            active
              ? "text-teal-900"
              : "text-slate-400 group-hover:text-teal-700 transition-colors"
          }
        >
          {icon}
        </span>
        {label}
      </div>
      {badge ? (
        <span
          className={`px-2 py-0.5 text-xs font-bold rounded-full ${
            active ? "bg-teal-700/10 text-teal-900" : "bg-emerald-100 text-emerald-800"
          }`}
        >
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

export default function AccountShell({
  user,
  title,
  children,
}: {
  user: AuthUser;
  title: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isAdmin = user.role === "admin";

  const avatarSrc = getUserAvatarUrl(user);

  const mainNav: NavLink[] = isAdmin
    ? [
        { icon: <LayoutDashboard size={20} />, label: "Dashboard", href: "/admin/dashboard" },
        { icon: <MapIcon size={20} />, label: "Tours & Packages", href: "/admin/packages" },
        { icon: <CalendarCheck size={20} />, label: "Bookings", href: "/admin/bookings" },
        { icon: <ClipboardList size={20} />, label: "Custom Trips", href: "/admin/custom-trips" },
      ]
    : [
        { icon: <Compass size={20} />, label: "Explore Tours", href: "/tours" },
        { icon: <CalendarDays size={20} />, label: "My Bookings", href: "/dashboard" },
        { icon: <Plane size={20} />, label: "My custom trips", href: "/custom-trips" },
      ];

  return (
    <div className="flex h-screen bg-[#f4fbf8] text-slate-900 font-sans overflow-hidden">
      {isSidebarOpen ? (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden
        />
      ) : null}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-emerald-100 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center px-6 border-b border-emerald-100">
            <div className="flex items-center gap-2 text-teal-700 font-bold text-xl tracking-tight">
              {isAdmin ? <MapPin className="w-6 h-6" /> : <Plane className="w-6 h-6" />}
              <span>{isAdmin ? "ExploreBD Admin" : "ExploreBD"}</span>
            </div>
            <button
              type="button"
              className="ml-auto lg:hidden text-slate-500"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {mainNav.map((item) => (
              <ShellNavItem
                key={item.href}
                icon={item.icon}
                label={item.label}
                href={item.href}
                badge={item.badge}
                active={pathname === item.href}
              />
            ))}
            <div className="mt-3 px-4 pt-3 text-xs font-semibold uppercase tracking-wider text-slate-400 border-t border-emerald-100">
              Profile
            </div>
            <ShellNavItem
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
        <header className="h-16 flex items-center justify-between px-6 bg-white/90 backdrop-blur-md border-b border-emerald-100 z-10 shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <button
              type="button"
              className="lg:hidden text-slate-500 hover:text-slate-900"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold tracking-tight truncate">{title}</h1>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button
              type="button"
              className="relative p-2 text-slate-500 hover:text-slate-900 rounded-full hover:bg-emerald-50"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 pl-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarSrc}
                alt=""
                className="w-9 h-9 rounded-full object-cover border-2 border-teal-200 shadow-sm"
              />
              <div className="hidden md:block text-sm">
                <p className="font-medium">{user.username}</p>
                <p className="text-xs text-slate-500">
                  {isAdmin ? "Administrator" : "Explorer"}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-3xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}
