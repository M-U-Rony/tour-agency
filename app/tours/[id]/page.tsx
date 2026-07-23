import { notFound } from "next/navigation";
import { Clock, MapPin, Star } from "lucide-react";
import { DbConnect } from "@/db/connection";
import { Booking, Review, TourPackage, User } from "@/db/models";
import { serializeTourPackage, formatBdt } from "@/lib/tour-package";
import { serializeReview, type ReviewDTO } from "@/lib/review";
import { getAuthFromCookies } from "@/lib/auth-api";
import BookPackageForm from "@/components/book-package-form";
import PackageReviews, { type UserBookingForPackage } from "@/components/package-reviews";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";

export const dynamic = "force-dynamic";

export default async function TourDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let pkg: ReturnType<typeof serializeTourPackage> | null = null;
  try {
    await DbConnect();
    const doc = await TourPackage.findById(id);
    if (doc) pkg = serializeTourPackage(doc);
  } catch {
    pkg = null;
  }
  if (!pkg) notFound();

  const auth = await getAuthFromCookies();
  const reviews = await loadReviews(pkg.id);
  let userBookings: UserBookingForPackage[] = [];
  if (auth) {
    userBookings = await loadUserBookingsForPackage(auth.userId, pkg.id, reviews);
  }

  const ratingRounded = Math.round(pkg.rating * 10) / 10;
  const showRating = pkg.rating > 0;
  const gallery = Array.from(new Set([pkg.imageUrl, ...(pkg.galleryUrls ?? [])])).filter(Boolean);
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
              <div className="mt-8">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Destination Photo Gallery ({gallery.length} photos)
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {gallery.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={src + i}
                      src={src}
                      alt="Destination gallery photo"
                      className="h-28 w-full rounded-2xl border border-emerald-100 object-cover shadow-sm transition-transform duration-300 hover:scale-[1.03]"
                    />
                  ))}
                </div>
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

            <PackageReviews
              packageId={pkg.id}
              initialReviews={reviews}
              isAuthed={!!auth}
              userBookings={userBookings}
              currentUserId={auth?.userId}
            />
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <BookPackageForm
              packageId={pkg.id}
              pricePerPerson={pkg.priceBdt}
              isAuthenticated={!!auth}
              totalSeats={pkg.totalSeats}
              availableSeats={pkg.availableSeats}
              startDate={pkg.startDate}
              endDate={pkg.endDate}
              availableDates={pkg.availableDates}
              adminPreview={auth?.role === "admin"}
            />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

async function loadReviews(packageId: string): Promise<ReviewDTO[]> {
  const docs = await Review.find({ packageId });
  const userIds = Array.from(new Set(docs.map((doc) => String(doc.userId))));
  const users = userIds.length
    ? await User.find({ _id: { $in: userIds } })
    : [];
  const userById = new Map(users.map((u) => [String(u._id), u]));
  return docs.map((doc) => serializeReview(doc, userById.get(String(doc.userId))));
}

async function loadUserBookingsForPackage(
  userId: string,
  packageId: string,
  reviews: ReviewDTO[]
): Promise<UserBookingForPackage[]> {
  const docs = await Booking.find({ userId });
  const reviewedBookingIds = new Set(reviews.map((r) => r.bookingId));

  return docs
    .filter((b) => String(b.packageId) === packageId)
    .map((b) => ({
      id: String(b._id),
      travelDate: new Date(b.travelDate).toISOString(),
      status: b.status,
      hasReviewed: reviewedBookingIds.has(String(b._id)),
    }));
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
