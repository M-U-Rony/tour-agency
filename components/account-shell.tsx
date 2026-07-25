"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { AuthUser } from "@/lib/auth-user";
import { clientSignOut } from "@/lib/client-auth";
import { getUserAvatarUrl } from "@/lib/user-avatar";
import {
  CalendarCheck,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Compass,
  ExternalLink,
  Heart,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  Menu,
  MessageSquare,
  Phone,
  Plane,
  User,
  UserCheck,
  X,
} from "lucide-react";
import NotificationBell from "@/components/notification-bell";

type NavLink = {
  icon: React.ReactNode;
  label: string;
  href: string;
  match?: (pathname: string) => boolean;
};

function isNavActive(pathname: string, href: string, match?: (pathname: string) => boolean) {
  if (match) return match(pathname);
  if (pathname === href) return true;
  if (href !== "/" && pathname.startsWith(`${href}/`)) return true;
  return false;
}

function ShellNavItem({
  icon,
  label,
  active,
  href,
  onNavigate,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  href: string;
  onNavigate?: () => void;
}) {
  const className = `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
    active
      ? "bg-teal-50 text-teal-900 font-semibold"
      : "text-slate-600 hover:bg-emerald-50 hover:text-slate-900"
  }`;

  return (
    <Link href={href} className={className} onClick={onNavigate}>
      <span
        className={
          active
            ? "text-teal-900"
            : "text-slate-400 group-hover:text-teal-700 transition-colors"
        }
      >
        {icon}
      </span>
      <span className="font-medium text-sm">{label}</span>
    </Link>
  );
}

function UserMenu({ user, onSignOut }: { user: AuthUser; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const avatarSrc = getUserAvatarUrl(user);
  const isAdmin = user.role === "admin";
  const dashboardHref = isAdmin ? "/admin/dashboard" : "/dashboard";

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-white px-2 py-1.5 text-sm hover:bg-[#f4fbf8] transition-colors"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarSrc}
          alt=""
          className="h-8 w-8 rounded-full border-2 border-teal-200 object-cover"
        />
        <div className="hidden text-left md:block">
          <p className="max-w-[120px] truncate font-medium leading-tight">{user.username}</p>
          <p className="text-xs text-slate-500">{isAdmin ? "Administrator" : "Explorer"}</p>
        </div>
        <ChevronDown className="hidden h-4 w-4 text-slate-400 md:block" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-lg"
        >
          <div className="border-b border-emerald-100 px-4 py-3">
            <p className="truncate text-sm font-semibold">{user.username}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
          <div className="py-1">
            <Link
              href={dashboardHref}
              className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-[#f4fbf8]"
              onClick={() => setOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/profile"
              className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-[#f4fbf8]"
              onClick={() => setOpen(false)}
            >
              Edit profile
            </Link>
            <Link
              href="/tours"
              className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-[#f4fbf8]"
              onClick={() => setOpen(false)}
            >
              Browse tours
            </Link>
          </div>
          <div className="border-t border-emerald-100 py-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function AccountShell({
  user,
  title,
  actions,
  wide = false,
  children,
}: {
  user: AuthUser;
  title: string;
  actions?: React.ReactNode;
  wide?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isAdmin = user.role === "admin";
  const isTourGuide = user.role === "tour_guide";

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  const mainNav: NavLink[] = isAdmin
    ? [
        {
          icon: <LayoutDashboard size={20} />,
          label: "Dashboard",
          href: "/admin/dashboard",
          match: (p) => p === "/admin/dashboard" || p === "/dashboard",
        },
        {
          icon: <MapIcon size={20} />,
          label: "Tours & Packages",
          href: "/admin/packages",
        },
        {
          icon: <CalendarCheck size={20} />,
          label: "Bookings",
          href: "/admin/bookings",
        },
        {
          icon: <ClipboardList size={20} />,
          label: "Custom Trips",
          href: "/admin/custom-trips",
        },
        {
          icon: <MessageSquare size={20} />,
          label: "Support & Messages",
          href: "/admin/messages",
        },
        {
          icon: <UserCheck size={20} />,
          label: "Tour Guides",
          href: "/admin/tour-guides",
        },
        {
          icon: <ExternalLink size={20} />,
          label: "View public site",
          href: "/tours",
          match: (p) => p === "/" || p === "/tours" || p.startsWith("/tours/"),
        },
      ]
    : isTourGuide
    ? [
        {
          icon: <Compass size={20} />,
          label: "My Assigned Tours",
          href: "/guide/dashboard",
          match: (p) => p === "/guide/dashboard" || p.startsWith("/guide/"),
        },
        {
          icon: <ExternalLink size={20} />,
          label: "View public site",
          href: "/tours",
          match: (p) => p === "/" || p === "/tours" || p.startsWith("/tours/"),
        },
      ]
    : [
        {
          icon: <Compass size={20} />,
          label: "Explore Tours",
          href: "/tours",
        },
        {
          icon: <CalendarDays size={20} />,
          label: "My Bookings",
          href: "/dashboard",
          match: (p) =>
            p === "/dashboard" || p === "/user/dashboard" || p.startsWith("/user/dashboard/"),
        },
        {
          icon: <Heart size={20} />,
          label: "My Wishlist",
          href: "/wishlist",
        },
        {
          icon: <Plane size={20} />,
          label: "My Custom Trips",
          href: "/custom-trips",
        },
        {
          icon: <MessageSquare size={20} />,
          label: "Contact Us & Support",
          href: "/contact",
        },
      ];

  function handleSignOut() {
    void clientSignOut(router);
  }

  return (
    <div className="flex h-dvh bg-[#f4fbf8] text-slate-900 font-sans overflow-hidden">
      {isSidebarOpen ? (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden
        />
      ) : null}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 flex w-64 shrink-0 flex-col border-r border-emerald-100 bg-white transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-emerald-100 px-6">
          <Link href={isAdmin ? "/admin/dashboard" : "/dashboard"} className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="ExploreBD" className="h-9 w-auto object-contain" />
            <span className="text-lg font-bold tracking-tight text-teal-800">ExploreBD</span>
          </Link>
          <button
            type="button"
            className="ml-auto text-slate-500 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
          <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {isAdmin ? "Administration" : "My account"}
          </p>
          {mainNav.map((item) => (
            <ShellNavItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              active={isNavActive(pathname, item.href, item.match)}
              onNavigate={() => setIsSidebarOpen(false)}
            />
          ))}
          <div className="mt-4 border-t border-emerald-100 pt-4">
            <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Profile
            </p>
            <ShellNavItem
              icon={<User size={20} />}
              label="Edit profile"
              href="/profile"
              active={pathname === "/profile"}
              onNavigate={() => setIsSidebarOpen(false)}
            />
          </div>
        </nav>

        <div className="border-t border-emerald-100 p-4">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
            onClick={handleSignOut}
          >
            <LogOut size={20} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-emerald-100 bg-white/90 px-4 backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="text-slate-500 hover:text-slate-900 lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {actions}
            {!isAdmin && (
              <Link
                href="/wishlist"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-100 bg-white text-slate-600 transition-colors hover:bg-emerald-50 hover:text-rose-500"
                title="My Wishlist"
              >
                <Heart size={18} />
              </Link>
            )}
            <NotificationBell />
            <UserMenu user={user} onSignOut={handleSignOut} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className={wide ? "mx-auto max-w-7xl" : "mx-auto max-w-6xl"}>{children}</div>
        </div>
      </main>
    </div>
  );
}
