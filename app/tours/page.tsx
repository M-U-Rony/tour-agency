import Link from "next/link";
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
  sort?: string;
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
  const travelers = Number(params.travelers ?? "");
  const sort = params.sort ?? "newest";
  const minPrice = Number(params.minPrice ?? "");
  const maxPrice = Number(params.maxPrice ?? "");

  const filter: Record<string, unknown> = { isActive: { $ne: false } };
  if (location) filter.location = { $regex: escapeRegex(location), $options: "i" };
  if (duration) filter.duration = { $regex: escapeRegex(duration), $options: "i" };
  if (Number.isFinite(travelers) && travelers > 0) {
    filter.maxTravelers = { $gte: travelers };
  }
  const priceFilter: Record<string, number> = {};
  if (Number.isFinite(minPrice) && minPrice > 0) priceFilter.$gte = minPrice;
  if (Number.isFinite(maxPrice) && maxPrice > 0) priceFilter.$lte = maxPrice;
  if (Object.keys(priceFilter).length) filter.priceBdt = priceFilter;

  let packages: TourPackageDTO[] = [];
  try {
    await DbConnect();
    let sortBy: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === "price-low") sortBy = { priceBdt: 1 };
    if (sort === "price-high") sortBy = { priceBdt: -1 };
    if (sort === "rating") sortBy = { rating: -1, createdAt: -1 };
    const docs = await TourPackage.find(filter)
      .sort(sortBy)
      .lean<LeanPackage[]>();
    packages = docs.map((doc) => serializeTourPackage(doc));
  } catch {
    packages = [];
  }

  const hasFilters = !!(
    location ||
    duration ||
    params.minPrice ||
    params.maxPrice ||
    params.travelers
  );

  return (
    <div className="min-h-screen bg-[#f4fbf8]">
      <SiteHeader
        isAuthed={!!auth}
        ctaHref="/dashboard"
        ctaLabel="My dashboard"
      />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Tours & packages
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Pick a trip - coastal escapes, hills, and heritage circuits across Bangladesh.
          </p>
        </div>

        <form
          className="mb-8 grid gap-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm md:grid-cols-[1fr_1fr_0.8fr_0.8fr_0.8fr_auto]"
          action="/tours"
        >
          <input
            name="location"
            defaultValue={location}
            placeholder="Destination"
            className="rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
          <input
            name="duration"
            defaultValue={duration}
            placeholder="Duration"
            className="rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
          <input
            name="minPrice"
            defaultValue={params.minPrice ?? ""}
            type="number"
            min={0}
            placeholder="Min price"
            className="rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
          <input
            name="maxPrice"
            defaultValue={params.maxPrice ?? ""}
            type="number"
            min={0}
            placeholder="Max price"
            className="rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
          <select
            name="sort"
            defaultValue={sort}
            className="rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="newest">Newest</option>
            <option value="rating">Top rated</option>
            <option value="price-low">Price low</option>
            <option value="price-high">Price high</option>
          </select>
          <button className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800">
            Search
          </button>
        </form>

        {packages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-emerald-200 bg-white px-6 py-16 text-center">
            <p className="text-slate-600">
              {hasFilters
                ? "No packages match your filters."
                : "New tours are coming soon."}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {hasFilters ? "Try clearing some filters, or" : "In the meantime,"}{" "}
              <Link
                href="/contact"
                className="font-semibold text-teal-700 hover:text-teal-800 underline underline-offset-4 decoration-teal-300"
              >
                request a custom trip
              </Link>
              {" "}and our team will plan something just for you.
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
