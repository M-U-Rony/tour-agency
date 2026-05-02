import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, MapPin, Star } from "lucide-react";
import { DbConnect } from "@/db/connection";
import { TourPackage } from "@/db/models";
import { serializeTourPackage, formatBdt } from "@/lib/tour-package";
import { getAuthFromCookies } from "@/lib/auth-api";
import BookPackageForm from "@/components/book-package-form";
import SiteHeader from "@/components/site-header";

export const dynamic = "force-dynamic";

type LeanPackage = {
  _id: unknown;
  title: string;
  location: string;
  duration: string;
  priceBdt: number;
  rating: number;
  shortDescription: string;
  imageUrl: string;
};

export default async function TourDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let pkg: ReturnType<typeof serializeTourPackage> | null = null;
  try {
    await DbConnect();
    const doc = await TourPackage.findById(id).lean<LeanPackage | null>();
    if (doc) pkg = serializeTourPackage(doc);
  } catch {
    pkg = null;
  }
  if (!pkg) notFound();

  const auth = await getAuthFromCookies();
  const ratingRounded = Math.round(pkg.rating * 10) / 10;
  const showRating = pkg.rating > 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <SiteHeader
        backHref="/tours"
        backLabel="All tours"
        ctaHref="/dashboard"
        ctaLabel="Dashboard"
        isAuthed={!!auth}
      />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pkg.imageUrl}
                alt={pkg.title}
                className="h-72 w-full object-cover sm:h-[420px]"
              />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 font-medium text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                <MapPin size={14} /> {pkg.location}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-medium dark:bg-slate-800 dark:text-slate-300">
                <Clock size={14} /> {pkg.duration}
              </span>
              {showRating ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                  <Star size={14} className="fill-current" /> {ratingRounded}
                </span>
              ) : null}
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              {pkg.title}
            </h1>
            <p className="mt-2 text-lg font-semibold text-slate-700 dark:text-slate-300">
              {pkg.duration} {pkg.location} Tour – {formatBdt(pkg.priceBdt)}
            </p>

            <p className="mt-6 text-base leading-relaxed text-slate-700 dark:text-slate-300">
              {pkg.shortDescription}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Highlight title="What's included">
                Comfortable transport, hotel stay, local guide, and curated stops on the route.
              </Highlight>
              <Highlight title="Good to know">
                Final timing is confirmed by our team after you submit a booking request.
              </Highlight>
            </div>
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <BookPackageForm
              packageId={pkg.id}
              pricePerPerson={pkg.priceBdt}
              isAuthenticated={!!auth}
              adminPreview={auth?.role === "admin"}
            />
          </aside>
        </div>
      </main>
    </div>
  );
}

function Highlight({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
        {title}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        {children}
      </p>
    </div>
  );
}
