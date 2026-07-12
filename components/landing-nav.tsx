"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import type { AuthUser } from "@/lib/auth-user";
import { clientSignOut } from "@/lib/client-auth";
import { useInsideSidebar } from "@/components/sidebar-context";

const navLinks = [
  { href: "#home", label: "Home", isAnchor: true },
  { href: "#packages", label: "Packages", isAnchor: true },
  { href: "#destinations", label: "Destinations", isAnchor: true },
  { href: "#about", label: "About", isAnchor: true },
  { href: "/contact", label: "Contact", isAnchor: false },
];

export default function LandingNav({ user }: { user: AuthUser | null }) {
  const isInsideSidebar = useInsideSidebar();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const dashboardHref = user?.role === "admin" ? "/admin/dashboard" : "/dashboard";

  if (isInsideSidebar) return null;

  return (
    <header className="relative z-20">
      <div className="flex items-center justify-between rounded-full border border-white/20 bg-white/10 px-4 py-3 text-white shadow-[0_18px_60px_rgba(0,0,0,0.16)] backdrop-blur md:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-base font-bold text-teal-800">
            EB
          </span>
          <div>
            <p className="text-lg font-semibold tracking-wide">ExploreBD</p>
            <p className="hidden text-xs text-white/70 sm:block">
              Premium travel across Bangladesh
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium lg:flex">
          {navLinks.map((link) =>
            link.isAnchor ? (
              <a key={link.href} href={link.href} className="transition hover:text-emerald-200">
                {link.label}
              </a>
            ) : (
              <Link key={link.href} href={link.href} className="transition hover:text-emerald-200">
                {link.label}
              </Link>
            )
          )}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link
                href={dashboardHref}
                className="rounded-full border border-white/25 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Hi, {user.username.split(/\s+/)[0]}
              </Link>
              <button
                type="button"
                onClick={() => void clientSignOut(router)}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/signin"
              className="rounded-full border border-white/25 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Sign in
            </Link>
          )}
          <Link
            href="/tours"
            className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-teal-950 shadow-lg shadow-teal-950/20 transition hover:-translate-y-0.5 hover:bg-emerald-100"
          >
            Book Now
          </Link>
        </div>

        <button
          type="button"
          className="rounded-full border border-white/25 p-2 text-white md:hidden"
          onClick={() => setOpen((s) => !s)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open ? (
        <div className="mt-3 rounded-2xl border border-white/20 bg-slate-900/90 p-4 backdrop-blur-md md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) =>
              link.isAnchor ? (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-white hover:bg-white/10"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-white hover:bg-white/10"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              )
            )}
            {user ? (
              <>
                <Link
                  href={dashboardHref}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-emerald-200 hover:bg-white/10"
                  onClick={() => setOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    void clientSignOut(router);
                  }}
                  className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-200 hover:bg-white/10"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/signin"
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-white hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                Sign in
              </Link>
            )}
            <Link
              href="/tours"
              className="mt-2 rounded-lg bg-white px-3 py-2.5 text-center text-sm font-semibold text-teal-950"
              onClick={() => setOpen(false)}
            >
              Book Now
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
