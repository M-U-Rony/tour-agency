import Link from "next/link";
import { Search, X } from "lucide-react";
import { DbConnect } from "@/db/connection";
import { TourPackage } from "@/db/models";
import PackageCard from "@/components/package-card";
import SiteHeader from "@/components/site-header";
import type { TourPackageDTO } from "@/lib/tour-package";
import { serializeTourPackage } from "@/lib/tour-package";
import { getAuthFromCookies } from "@/lib/auth-api";

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
  const auth = await getAuthFromCookies();
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
      <SiteHeader
        isAuthed={!!auth}
        ctaHref="/dashboard"
        ctaLabel="My dashboard"
      />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Tours & packages
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Pick a trip — coastal escapes, hills, and heritage circuits across Bangladesh.
          </p>
        </div>

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
