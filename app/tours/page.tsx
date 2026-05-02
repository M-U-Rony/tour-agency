import Link from "next/link";
import { Search, X } from "lucide-react";
import { DbConnect } from "@/db/connection";
import { TourPackage } from "@/db/models";
import PackageCard from "@/components/package-card";
import type { TourPackageDTO } from "@/lib/tour-package";
import { serializeTourPackage } from "@/lib/tour-package";

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

type SearchParams = {
  location?: string;
  minPrice?: string;
  maxPrice?: string;
  duration?: string;
  travelers?: string;
};

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default async function ToursPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const location = (params.location ?? "").trim();
  const duration = (params.duration ?? "").trim();
  const minPrice = Number(params.minPrice ?? "");
  const maxPrice = Number(params.maxPrice ?? "");

  const filter: Record<string, unknown> = {};
  if (location) filter.location = { $regex: escapeRegex(location), $options: "i" };
  if (duration) filter.duration = { $regex: escapeRegex(duration), $options: "i" };
  const priceFilter: Record<string, number> = {};
  if (Number.isFinite(minPrice) && minPrice > 0) priceFilter.$gte = minPrice;
  if (Number.isFinite(maxPrice) && maxPrice > 0) priceFilter.$lte = maxPrice;
  if (Object.keys(priceFilter).length) filter.priceBdt = priceFilter;

  let packages: TourPackageDTO[] = [];
  try {
    await DbConnect();
    const docs = await TourPackage.find(filter)
      .sort({ createdAt: -1 })
      .lean<LeanPackage[]>();
    packages = docs.map((doc) => serializeTourPackage(doc));
  } catch {
    packages = [];
  }

  const hasFilters = !!(location || duration || params.minPrice || params.maxPrice);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <Link
              href="/"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              ← ExploreBD
            </Link>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Tours & packages
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Pick a trip — coastal escapes, hills, and heritage circuits across Bangladesh.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 dark:hover:bg-indigo-500"
          >
            My dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <form
          method="GET"
          className="mb-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:grid-cols-[1.4fr_1fr_0.8fr_0.8fr_auto]"
        >
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Location
            </span>
            <input
              type="text"
              name="location"
              defaultValue={location}
              placeholder="Cox's Bazar, Sajek…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Duration
            </span>
            <input
              type="text"
              name="duration"
              defaultValue={duration}
              placeholder="3 Days"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Min ৳
            </span>
            <input
              type="number"
              min={0}
              name="minPrice"
              defaultValue={params.minPrice ?? ""}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Max ৳
            </span>
            <input
              type="number"
              min={0}
              name="maxPrice"
              defaultValue={params.maxPrice ?? ""}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </label>
          <button
            type="submit"
            className="inline-flex items-end justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 dark:hover:bg-indigo-500"
          >
            <Search size={16} />
            Search
          </button>
        </form>

        {hasFilters && (
          <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            {location && <FilterChip label={`Location: ${location}`} />}
            {duration && <FilterChip label={`Duration: ${duration}`} />}
            {params.minPrice && <FilterChip label={`Min ৳${params.minPrice}`} />}
            {params.maxPrice && <FilterChip label={`Max ৳${params.maxPrice}`} />}
            <Link
              href="/tours"
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <X size={12} />
              Clear filters
            </Link>
          </div>
        )}

        {packages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-950">
            <p className="text-slate-600 dark:text-slate-400">
              {hasFilters
                ? "No packages match your filters."
                : "New tours are coming soon."}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {hasFilters ? "Try clearing some filters." : "Please check back later."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function FilterChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 font-medium text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
      {label}
    </span>
  );
}
