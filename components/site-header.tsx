import Link from "next/link";

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
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-950/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {backHref ? (
            <Link
              href={backHref}
              className="shrink-0 text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              ← {backLabel}
            </Link>
          ) : null}

          <Link href="/" className="flex items-center gap-2 min-w-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-extrabold text-white shadow-sm shadow-indigo-600/25">
              EB
            </span>
            <span className="truncate text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
              ExploreBD
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-5 text-sm font-semibold text-slate-600 dark:text-slate-300 md:flex">
          <Link href="/tours" className="hover:text-slate-900 dark:hover:text-white">
            Tours
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {isAuthed ? (
            <>
              <form action="/api/auth/signout" method="post" className="hidden sm:block">
                <button
                  type="submit"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/signin"
              className="hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900 sm:inline-flex"
            >
              Sign in
            </Link>
          )}
          <Link
            href={isAuthed ? dashboardHref : ctaHref}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-600/25 transition-colors hover:bg-indigo-700 dark:hover:bg-indigo-500"
          >
            {isAuthed ? "My dashboard" : ctaLabel}
          </Link>
        </div>
      </div>
    </header>
  );
}

