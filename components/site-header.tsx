"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, LogOut, Menu, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { clientSignOut } from "@/lib/client-auth";
import { getUserAvatarUrl } from "@/lib/user-avatar";
import { useInsideSidebar } from "@/components/sidebar-context";

type Props = {
  backHref?: string;
  backLabel?: string;
  ctaHref?: string;
  ctaLabel?: string;
  isAuthed?: boolean;
};

export default function SiteHeader({
  backHref,
  backLabel = "Back",
  ctaHref = "/tours",
  ctaLabel = "Explore tours",
  isAuthed = false,
}: Props) {
  const isInsideSidebar = useInsideSidebar();
  const router = useRouter();
  const { user } = useAuthUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);
  const avatarSrc = user ? getUserAvatarUrl(user) : null;
  const dashboardHref =
    user?.role === "admin" ? "/admin/dashboard" : "/dashboard";

  useEffect(() => {
    if (!userOpen) return;
    function handleClick(e: MouseEvent) {
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setUserOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [userOpen]);

  if (isInsideSidebar) {
    if (backHref) {
      return (
        <div className="mb-6">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>{backLabel}</span>
          </Link>
        </div>
      );
    }
    return null;
  }

  function handleSignOut() {
    setUserOpen(false);
    void clientSignOut(router);
  }

  const navLinks = [
    { href: "/tours", label: "Tours" },
    { href: "/contact", label: "Custom trip" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-emerald-100/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-center gap-3">
          {backHref ? (
            <Link
              href={backHref}
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">{backLabel}</span>
            </Link>
          ) : null}

          <Link href="/" className="flex min-w-0 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-sm font-extrabold text-white shadow-sm shadow-teal-900/25">
              EB
            </span>
            <span className="truncate text-sm font-extrabold tracking-tight text-slate-900 sm:text-base">
              ExploreBD
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-teal-700">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="relative" ref={userRef}>
              <button
                type="button"
                onClick={() => setUserOpen((s) => !s)}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-white px-2 py-1.5 text-sm font-semibold text-slate-700 hover:bg-[#f4fbf8]"
                aria-expanded={userOpen}
              >
                {avatarSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarSrc} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <User size={14} />
                  </span>
                )}
                <span className="hidden max-w-[100px] truncate sm:inline-block">
                  {user.username}
                </span>
                <ChevronDown size={14} className="hidden sm:block" />
              </button>

              {userOpen ? (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-lg">
                  <div className="border-b px-3 py-3">
                    <p className="truncate text-sm font-semibold">{user.username}</p>
                    <p className="text-xs text-slate-500">
                      {user.role === "admin" ? "Administrator" : "Explorer"}
                    </p>
                  </div>
                  <div className="py-1">
                    <Link
                      href={dashboardHref}
                      className="block px-3 py-2 text-sm hover:bg-slate-50"
                      onClick={() => setUserOpen(false)}
                    >
                      My dashboard
                    </Link>
                    <Link
                      href="/profile"
                      className="block px-3 py-2 text-sm hover:bg-slate-50"
                      onClick={() => setUserOpen(false)}
                    >
                      Edit profile
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <Link
              href="/signin"
              className="hidden rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-[#f4fbf8] sm:inline-flex"
            >
              Sign in
            </Link>
          )}

          <Link
            href={user ? dashboardHref : isAuthed ? dashboardHref : ctaHref}
            className="hidden rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-teal-900/25 transition-colors hover:bg-teal-800 sm:inline-flex"
          >
            {user ? "Dashboard" : ctaLabel}
          </Link>

          {(user || isAuthed) && (
            <button
              type="button"
              onClick={handleSignOut}
              className="hidden rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 sm:inline-flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut size={14} />
              Sign out
            </button>
          )}

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl border border-emerald-100 p-2 text-slate-600 hover:bg-[#f4fbf8] md:hidden"
            onClick={() => setMenuOpen((s) => !s)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="border-t border-emerald-100 bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-[#f4fbf8]"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  href={dashboardHref}
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-teal-700 hover:bg-teal-50"
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-[#f4fbf8]"
                  onClick={() => setMenuOpen(false)}
                >
                  Edit profile
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    handleSignOut();
                  }}
                  className="rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-[#f4fbf8]"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href={ctaHref}
                  className="rounded-lg bg-teal-700 px-3 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
                  onClick={() => setMenuOpen(false)}
                >
                  {ctaLabel}
                </Link>
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
