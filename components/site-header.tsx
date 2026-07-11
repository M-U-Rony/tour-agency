"use client";

import Link from "next/link";
import { ArrowLeft, ChevronDown, User } from "lucide-react";
import { useState } from "react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { getUserAvatarUrl } from "@/lib/user-avatar";

type Props = {
  backHref?: string;
  backLabel?: string;
  /** Optional right-side call to action */
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
  const dashboardHref = "/dashboard";
  const { user } = useAuthUser();
  const [open, setOpen] = useState(false);
  const avatarSrc = user ? getUserAvatarUrl(user) : null;

  return (
    <header className="sticky top-0 z-20 border-b border-emerald-100/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {backHref ? (
            <Link
              href={backHref}
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800"
            >
              <ArrowLeft size={16} />
              {backLabel}
            </Link>
          ) : null}

          <Link href="/" className="flex min-w-0 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-sm font-extrabold text-white shadow-sm shadow-teal-900/25">
              EB
            </span>
            <span className="truncate text-sm font-extrabold tracking-tight text-slate-900">
              ExploreBD
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-5 text-sm font-semibold text-slate-600 md:flex">
          <Link href="/tours" className="hover:text-slate-900">
            Tours
          </Link>
          {isAuthed && (
            <Link href="/contact" className="hover:text-slate-900">
              Custom trip
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpen((s) => !s)}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-2 py-1 text-sm font-semibold text-slate-700 hover:bg-[#f4fbf8]"
              >
                {avatarSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarSrc}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <User size={14} />
                  </span>
                )}
                <span className="hidden sm:inline-block">{user.username}</span>
                <ChevronDown size={14} />
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-56 rounded-md border bg-white shadow-lg">
                  <div className="p-3">
                    <p className="font-semibold text-sm">{user.username}</p>
                    <p className="text-xs text-slate-500">
                      {user.role === "admin" ? "Administrator" : "Explorer"}
                    </p>
                  </div>
                  <div className="border-t" />
                  <div className="flex flex-col py-1">
                    <Link
                      href="/profile"
                      className="px-3 py-2 text-sm hover:bg-slate-50"
                    >
                      Edit profile
                    </Link>
                    <Link
                      href="/dashboard"
                      className="px-3 py-2 text-sm hover:bg-slate-50"
                    >
                      My dashboard
                    </Link>
                    <form action="/api/auth/signout" method="post">
                      <button
                        type="submit"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                      >
                        Sign out
                      </button>
                    </form>
                  </div>
                </div>
              )}
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
            href={user ? dashboardHref : ctaHref}
            className="inline-flex items-center justify-center rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-teal-900/25 transition-colors hover:bg-teal-800"
          >
            {user ? "My dashboard" : ctaLabel}
          </Link>
        </div>
      </div>
    </header>
  );
}
