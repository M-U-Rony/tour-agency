import { notFound } from "next/navigation";
import { Clock, MapPin, Star } from "lucide-react";
import { DbConnect } from "@/db/connection";
import { Review, TourPackage, User } from "@/db/models";
import { serializeTourPackage, formatBdt } from "@/lib/tour-package";
import { serializeReview, type ReviewDTO } from "@/lib/review";
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
  galleryUrls?: string[];
  itinerary?: string[];
  inclusions?: string[];
  exclusions?: string[];
  pickupInfo?: string;
  cancellationPolicy?: string;
  availableDates?: Date[];
  maxTravelers?: number;
  isActive?: boolean;
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
  const reviews = await loadReviews(pkg.id);
  const ratingRounded = Math.round(pkg.rating * 10) / 10;
  const showRating = pkg.rating > 0;
  const gallery = [pkg.imageUrl, ...(pkg.galleryUrls ?? [])].slice(0, 4);
  const itinerary =
    pkg.itinerary && pkg.itinerary.length
      ? pkg.itinerary
      : [
          "Confirm pickup, route, and rooming details with our travel desk.",
          "Travel with planned sightseeing stops and local guide support.",
          "Return after breakfast or the final activity, depending on the package.",
        ];
  const inclusions =
    pkg.inclusions && pkg.inclusions.length
      ? pkg.inclusions
      : ["Transport coordination", "Hotel stay support", "Local planning assistance"];

  return (
    <div className="min-h-screen bg-[#f4fbf8]">
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
            <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pkg.imageUrl}
                alt={pkg.title}
                className="h-72 w-full object-cover sm:h-[420px]"
              />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1 font-medium text-teal-800">
                <MapPin size={14} /> {pkg.location}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-medium">
                <Clock size={14} /> {pkg.duration}
              </span>
              {showRating ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-700">
                  <Star size={14} className="fill-current" /> {ratingRounded}
                </span>
              ) : null}
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {pkg.title}
            </h1>
            <p className="mt-2 text-lg font-semibold text-slate-700">
              {pkg.duration} {pkg.location} Tour - {formatBdt(pkg.priceBdt)}
            </p>

            <p className="mt-6 text-base leading-relaxed text-slate-700">
              {pkg.shortDescription}
            </p>

            {gallery.length > 1 && (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {gallery.map((src) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={src}
                    src={src}
                    alt=""
                    className="h-28 rounded-2xl border border-emerald-100 object-cover"
                  />
                ))}
              </div>
            )}

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Highlight title="What's included">{inclusions.join(", ")}.</Highlight>
              <Highlight title="Good to know">
                {pkg.pickupInfo ||
                  "Final timing is confirmed by our team after you submit a booking request."}
              </Highlight>
            </div>

            <section className="mt-10 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Trip plan</h2>
              <div className="mt-5 space-y-4">
                {itinerary.map((item, index) => (
                  <div key={`${item}-${index}`} className="flex gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-bold text-teal-800">
                      {index + 1}
                    </span>
                    <p className="pt-1 text-sm leading-6 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-6 grid gap-4 sm:grid-cols-2">
              <InfoList title="Not included" items={pkg.exclusions ?? []} fallback="Meals, personal expenses, and anything not listed as included." />
              <Highlight title="Cancellation">
                {pkg.cancellationPolicy ||
                  "Cancellation and refund terms are confirmed by our team before payment."}
              </Highlight>
            </section>

            <section className="mt-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Traveler reviews</h2>
                <span className="text-sm font-semibold text-teal-700">
                  {reviews.length} verified
                </span>
              </div>
              {reviews.length === 0 ? (
                <p className="mt-4 rounded-2xl border border-dashed border-emerald-200 bg-white p-6 text-sm text-slate-500">
                  No reviews yet. Completed travelers can review this package from their dashboard.
                </p>
              ) : (
                <div className="mt-4 grid gap-4">
                  {reviews.map((review) => (
                    <article
                      key={review.id}
                      className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-900">
                          {review.user?.username || "Traveler"}
                        </p>
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          <Star size={14} className="fill-current" /> {review.rating}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-700">
                        {review.comment}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>
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

async function loadReviews(packageId: string): Promise<ReviewDTO[]> {
  const docs = await Review.find({ packageId }).sort({ createdAt: -1 }).lean();
  const userIds = Array.from(new Set(docs.map((doc) => String(doc.userId))));
  const users = userIds.length
    ? await User.find({ _id: { $in: userIds } }).select("name").lean()
    : [];
  const userById = new Map(users.map((u) => [String(u._id), u]));
  return docs.map((doc) => serializeReview(doc, userById.get(String(doc.userId))));
}

function Highlight({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
        {title}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">
        {children}
      </p>
    </div>
  );
}

function InfoList({
  title,
  items,
  fallback,
}: {
  title: string;
  items: string[];
  fallback: string;
}) {
  const list = items.length ? items : [fallback];
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
        {title}
      </p>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
        {list.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </div>
  );
}
