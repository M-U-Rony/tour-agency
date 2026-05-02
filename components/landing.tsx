import Image from "next/image";
import Link from "next/link";
import type { TourPackageDTO } from "@/lib/tour-package";
import { formatBdt } from "@/lib/tour-package";
import type { AuthUser } from "@/lib/auth-user";

const destinations = [
  {
    name: "Cox's Bazar",
    description: "Long beach walks, family-friendly stays, and seafood evenings by the Bay of Bengal.",
    image: "/sea beach.jpg",
  },
  {
    name: "Sajek Valley",
    description: "Cloud-kissed hills, cozy resorts, and sunrise viewpoints above rolling green ridges.",
    image: "/sajek.jpg",
  },
  {
    name: "Bandarban",
    description: "Adventure-led mountain journeys with hill tracks, local food, and scenic valley stops.",
    image: "/hill tracks.jpg",
  },
  {
    name: "Sylhet",
    description: "Tea garden serenity, waterfall day trips, and laid-back nature experiences.",
    image: "/tea garden.jpg",
  },
  {
    name: "Sundarbans",
    description: "Guided mangrove expeditions with river cruises and safe eco-travel planning.",
    image: "/sundarbhan.jpg",
  },
] as const;

const fallbackPackages = [
  {
    id: "fallback-1",
    title: "Cox's Bazar Premium Escape",
    duration: "4 Days / 3 Nights",
    priceBdt: 18500,
    rating: 4.9,
    shortDescription:
      "Beachfront hotel, AC transport, seafood dining, and curated leisure activities.",
    imageUrl: "/sea beach.jpg",
    location: "Cox's Bazar",
  },
  {
    id: "fallback-2",
    title: "Sajek Sky Trail",
    duration: "3 Days / 2 Nights",
    priceBdt: 12500,
    rating: 4.8,
    shortDescription:
      "Hilltop resort stay, transport from Dhaka, local guide, and scenic sunrise tour.",
    imageUrl: "/sajek.jpg",
    location: "Sajek",
  },
  {
    id: "fallback-3",
    title: "Sylhet Tea Garden Retreat",
    duration: "5 Days / 4 Nights",
    priceBdt: 22900,
    rating: 4.9,
    shortDescription:
      "Comfort stay, tea estate tours, Ratargul visit, and private intercity transport.",
    imageUrl: "/tea garden 2.jpg",
    location: "Sylhet",
  },
] satisfies TourPackageDTO[];

const reasons = [
  "Trusted tour guides",
  "Affordable packages",
  "24/7 customer support",
  "Secure booking and payment",
  "Best travel experience",
] as const;

const testimonials = [
  {
    name: "Nusrat Jahan",
    role: "Family Traveler",
    quote: "Everything felt polished from transport pickup to hotel check-in. Cox's Bazar was effortless with them.",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Fahim Rahman",
    role: "Adventure Seeker",
    quote: "Our Sajek trip was organized with real attention to timing, safety, and the best viewpoints.",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Samira Ahmed",
    role: "Corporate Client",
    quote: "We booked a group retreat in Sylhet and the coordination was strong throughout the entire tour.",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80",
  },
] as const;

function StarRow() {
  return (
    <div className="flex items-center gap-1 text-amber-400" aria-label="5 star rating">
      {Array.from({ length: 5 }).map((_, index) => (
        <svg
          key={index}
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M10 1.75l2.55 5.18 5.72.84-4.13 4.03.98 5.69L10 14.82 4.88 17.5l.98-5.69L1.73 7.77l5.72-.84L10 1.75z" />
        </svg>
      ))}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
      <circle cx="10" cy="10" r="10" className="fill-emerald-500/15" />
      <path
        d="M6 10.2 8.5 12.7 14 7.3"
        className="stroke-emerald-600"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type LandingProps = {
  topPackages?: TourPackageDTO[];
  currentUser?: AuthUser | null;
};

export default function Landing({ topPackages, currentUser }: LandingProps = {}) {
  const packages =
    topPackages && topPackages.length > 0 ? topPackages : fallbackPackages;
  const user = currentUser ?? null;
  const isLive = !!(topPackages && topPackages.length > 0);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ecf7ff_0%,#f7fbfd_32%,#ffffff_100%)] text-slate-900">
      <section className="relative isolate overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgba(5, 34, 63, 0.88), rgba(8, 89, 120, 0.60) 45%, rgba(9, 124, 103, 0.44)), url('/sajek.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(52,211,153,0.18),transparent_25%)]" />

        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 pb-16 pt-6 lg:px-10">
          <header className="flex items-center justify-between rounded-full border border-white/20 bg-white/10 px-4 py-3 text-white shadow-[0_18px_60px_rgba(0,0,0,0.16)] backdrop-blur md:px-6">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-base font-bold text-sky-800">
                EB
              </span>
              <div>
                <p className="text-lg font-semibold tracking-wide">ExploreBD Tours</p>
                <p className="text-xs text-white/70">Premium travel across Bangladesh</p>
              </div>
            </Link>

            <nav className="hidden items-center gap-7 text-sm font-medium lg:flex">
              <a href="#home" className="transition hover:text-emerald-200">
                Home
              </a>
              <a href="#packages" className="transition hover:text-emerald-200">
                Packages
              </a>
              <a href="#destinations" className="transition hover:text-emerald-200">
                Destinations
              </a>
              <a href="#about" className="transition hover:text-emerald-200">
                About
              </a>
              <a href="#contact" className="transition hover:text-emerald-200">
                Contact
              </a>
            </nav>

            <div className="hidden items-center gap-3 md:flex">
              {user ? (
                <Link
                  href={user.role === "admin" ? "/admin/dashboard" : "/dashboard"}
                  className="rounded-full border border-white/25 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Hi, {user.username.split(/\s+/)[0]}
                </Link>
              ) : (
                <Link
                  href="/signin"
                  className="rounded-full border border-white/25 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Login / Sign Up
                </Link>
              )}
              <Link
                href="/tours"
                className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-sky-950 shadow-lg shadow-sky-950/20 transition hover:-translate-y-0.5 hover:bg-emerald-100"
              >
                Book Now
              </Link>
            </div>
          </header>

          <div
            id="home"
            className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24"
          >
            <div className="max-w-3xl">
              <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium tracking-wide text-emerald-100 backdrop-blur">
                Curated holidays, transport, hotels, and local guides
              </span>
              <h1 className="mt-6 max-w-3xl font-[Georgia,Times_New_Roman,serif] text-5xl leading-tight font-semibold text-white sm:text-6xl lg:text-7xl">
                Discover the Beauty of Bangladesh
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-sky-50/88 sm:text-xl">
                Book unforgettable tours to Cox&apos;s Bazar, Sajek, Sylhet, and Sundarbans with
                premium planning, trusted guides, and smooth end-to-end travel support.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/tours"
                  className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-7 py-4 text-base font-semibold text-slate-950 shadow-[0_18px_50px_rgba(16,185,129,0.28)] transition hover:-translate-y-0.5 hover:bg-emerald-300"
                >
                  Explore Tours
                </Link>
                <a
                  href="#contact"
                  className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-7 py-4 text-base font-semibold text-white backdrop-blur transition hover:bg-white/16"
                >
                  Plan Your Trip
                </a>
              </div>

              <form
                action="/tours"
                method="GET"
                className="mt-10 grid max-w-2xl gap-4 rounded-4xl border border-white/18 bg-white/10 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.18)] backdrop-blur-xl md:grid-cols-[1.2fr_1fr_0.8fr_auto]"
              >
                <label className="space-y-2 rounded-2xl bg-white/92 px-4 py-3 text-slate-700">
                  <span className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Destination
                  </span>
                  <input
                    type="text"
                    name="location"
                    placeholder="Where do you want to go?"
                    className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
                  />
                </label>
                <label className="space-y-2 rounded-2xl bg-white/92 px-4 py-3 text-slate-700">
                  <span className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Duration
                  </span>
                  <input
                    type="text"
                    name="duration"
                    placeholder="3 Days"
                    className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
                  />
                </label>
                <label className="space-y-2 rounded-2xl bg-white/92 px-4 py-3 text-slate-700">
                  <span className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Max ৳
                  </span>
                  <input
                    type="number"
                    name="maxPrice"
                    min={0}
                    placeholder="20000"
                    className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded-2xl bg-sky-900 px-6 py-4 text-sm font-semibold text-white transition hover:bg-sky-800"
                >
                  Search
                </button>
              </form>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-4xl border border-white/20 bg-white/12 p-6 text-white shadow-[0_18px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
                <p className="text-sm uppercase tracking-[0.3em] text-emerald-100">Top Choice</p>
                <h2 className="mt-3 text-2xl font-semibold">Summer in Sajek Valley</h2>
                <p className="mt-3 text-sm leading-7 text-sky-50/85">
                  A cloud-side escape with a hill resort, breakfast view deck, and private transfer
                  from Dhaka.
                </p>
                <div className="mt-6 flex items-end justify-between">
                  <div>
                    <p className="text-sm text-white/70">Starting from</p>
                    <p className="text-3xl font-semibold">৳12,500</p>
                  </div>
                  <div className="rounded-2xl bg-white/12 px-4 py-3 text-right">
                    <p className="text-sm text-white/70">Rated</p>
                    <p className="text-xl font-semibold">4.8 / 5</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-1 md:gap-5 lg:grid-cols-3">
                {[
                  { value: "12k+", label: "Happy travelers" },
                  { value: "250+", label: "Curated tours" },
                  { value: "98%", label: "Repeat bookings" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[1.75rem] border border-white/18 bg-white/12 p-5 text-center text-white shadow-[0_18px_50px_rgba(0,0,0,0.14)] backdrop-blur-xl"
                  >
                    <p className="text-3xl font-semibold">{item.value}</p>
                    <p className="mt-2 text-sm text-sky-50/80">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="destinations" className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-700">
              Popular Destinations
            </p>
            <h2 className="mt-4 font-[Georgia,Times_New_Roman,serif] text-4xl font-semibold text-slate-950 sm:text-5xl">
              Signature journeys across Bangladesh
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Pick from coastal retreats, hill adventures, forest expeditions, and culture-rich
              escapes designed for comfort and discovery.
            </p>
          </div>
          <Link
            href="/tours"
            className="inline-flex w-fit items-center rounded-full border border-sky-200 bg-white px-5 py-3 text-sm font-semibold text-sky-900 shadow-sm transition hover:border-sky-300 hover:bg-sky-50"
          >
            View all tours
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-5">
          {destinations.map((destination) => (
            <article
              key={destination.name}
              className="group overflow-hidden rounded-4xl bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(14,116,144,0.16)]"
            >
              <div className="relative h-64 overflow-hidden">
                <Image
                  src={destination.image}
                  alt={destination.name}
                  fill
                  sizes="(min-width: 1280px) 20vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-slate-950/60 via-slate-950/10 to-transparent" />
                <div className="absolute bottom-4 left-4 rounded-full bg-white/88 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-sky-900 uppercase backdrop-blur">
                  Bangladesh
                </div>
              </div>
              <div className="space-y-4 p-6">
                <h3 className="text-2xl font-semibold text-slate-900">{destination.name}</h3>
                <p className="text-sm leading-7 text-slate-600">{destination.description}</p>
                <Link
                  href={`/tours?location=${encodeURIComponent(destination.name)}`}
                  className="inline-flex items-center rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-900 transition hover:bg-emerald-50 hover:text-emerald-800"
                >
                  Explore destination
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        id="packages"
        className="bg-[linear-gradient(180deg,rgba(236,247,255,0.45)_0%,rgba(220,252,231,0.28)_100%)]"
      >
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">
              Featured Tour Packages
            </p>
            <h2 className="mt-4 font-[Georgia,Times_New_Roman,serif] text-4xl font-semibold text-slate-950 sm:text-5xl">
              Crafted for comfort, scenery, and easy booking
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Every package combines handpicked hotels, transport planning, and local coordination
              so travelers spend more time enjoying the trip.
            </p>
          </div>

          <div className="mt-10 grid gap-6 xl:grid-cols-3">
            {packages.map((tourPackage) => (
              <article
                key={tourPackage.id}
                className="overflow-hidden rounded-4xl bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70"
              >
                <div className="relative h-72">
                  <Image
                    src={tourPackage.imageUrl}
                    alt={tourPackage.title}
                    fill
                    sizes="(min-width: 1280px) 33vw, 100vw"
                    className="object-cover"
                    unoptimized={tourPackage.imageUrl.startsWith("http")}
                  />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-linear-to-t from-slate-950/70 to-transparent px-6 py-6 text-white">
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
                      {tourPackage.duration}
                    </span>
                    <span className="text-2xl font-semibold">
                      {formatBdt(tourPackage.priceBdt)}
                    </span>
                  </div>
                </div>
                <div className="space-y-4 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-2xl font-semibold text-slate-900">
                      {tourPackage.title}
                    </h3>
                    <div className="text-right">
                      <StarRow />
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {tourPackage.rating.toFixed(1)}/5
                      </p>
                    </div>
                  </div>
                  <p className="text-sm leading-7 text-slate-600">
                    {tourPackage.shortDescription}
                  </p>
                  {isLive ? (
                    <Link
                      href={`/tours/${tourPackage.id}`}
                      className="inline-flex items-center rounded-full bg-sky-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800"
                    >
                      View Details
                    </Link>
                  ) : (
                    <Link
                      href="/tours"
                      className="inline-flex items-center rounded-full bg-sky-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800"
                    >
                      Browse all tours
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[0.95fr_1.05fr] lg:px-10">
        <div className="rounded-4xl bg-sky-950 p-8 text-white shadow-[0_24px_80px_rgba(12,74,110,0.26)] sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-200">
            Why Choose Us
          </p>
          <h2 className="mt-4 font-[Georgia,Times_New_Roman,serif] text-4xl font-semibold sm:text-5xl">
            Travel planning that feels premium from the first inquiry
          </h2>
          <p className="mt-5 text-lg leading-8 text-sky-100/85">
            ExploreBD Tours combines dependable logistics with elevated hospitality for local and
            international travelers discovering Bangladesh.
          </p>

          <div className="mt-8 grid gap-4">
            {reasons.map((reason) => (
              <div
                key={reason}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 px-4 py-4"
              >
                <CheckIcon />
                <span className="text-base font-medium text-sky-50">{reason}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-4xl bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-700">
              Services
            </p>
            <h3 className="mt-4 text-3xl font-semibold text-slate-950">Everything in one place</h3>
            <p className="mt-4 leading-8 text-slate-600">
              Tour packages, hotel reservations, airport and city transport, and guided travel
              support tailored to each route.
            </p>
          </div>
          <div className="rounded-4xl bg-emerald-50 p-8 shadow-[0_20px_60px_rgba(16,185,129,0.10)] ring-1 ring-emerald-100">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-700">
              Support
            </p>
            <h3 className="mt-4 text-3xl font-semibold text-slate-950">Assistance at every step</h3>
            <p className="mt-4 leading-8 text-slate-600">
              Our team handles route timing, hotel coordination, guide allocation, and booking
              questions around the clock.
            </p>
          </div>
          <div className="rounded-4xl bg-slate-50 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/70">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
              Safety
            </p>
            <h3 className="mt-4 text-3xl font-semibold text-slate-950">Reliable and secure</h3>
            <p className="mt-4 leading-8 text-slate-600">
              Verified operators, clear itineraries, secure payment flow, and transparent package
              inclusions built for trust.
            </p>
          </div>
          <div className="rounded-4xl bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-700">
              Experience
            </p>
            <h3 className="mt-4 text-3xl font-semibold text-slate-950">Memorable by design</h3>
            <p className="mt-4 leading-8 text-slate-600">
              Thoughtful pacing, scenic stays, and authentic local moments that turn a trip into a
              story worth retelling.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-700">
            Customer Testimonials
          </p>
          <h2 className="mt-4 font-[Georgia,Times_New_Roman,serif] text-4xl font-semibold text-slate-950 sm:text-5xl">
            Travelers who came for a trip and left with stories
          </h2>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article
              key={testimonial.name}
              className="rounded-4xl bg-white p-7 shadow-[0_20px_60px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70"
            >
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 overflow-hidden rounded-full">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">{testimonial.name}</h3>
                  <p className="text-sm text-slate-500">{testimonial.role}</p>
                </div>
              </div>
              <div className="mt-5">
                <StarRow />
              </div>
              <p className="mt-5 text-base leading-8 text-slate-600">&ldquo;{testimonial.quote}&rdquo;</p>
            </article>
          ))}
        </div>
      </section>

      <section id="cta" className="px-6 pb-20 lg:px-10">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-[linear-gradient(135deg,#082f49_0%,#0f766e_55%,#10b981_100%)] px-8 py-14 text-white shadow-[0_26px_90px_rgba(8,47,73,0.28)] sm:px-12 lg:flex lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-100">
              Ready for Your Next Adventure?
            </p>
            <h2 className="mt-4 font-[Georgia,Times_New_Roman,serif] text-4xl font-semibold sm:text-5xl">
              Let ExploreBD Tours design your perfect Bangladesh getaway
            </h2>
            <p className="mt-5 text-lg leading-8 text-sky-50/88">
              Choose a package or talk to our team for a tailored route with hotel, transport, and
              guide support included.
            </p>
          </div>
          <div className="mt-8 lg:mt-0">
            <Link
              href="/tours"
              className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-base font-semibold text-sky-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-100"
            >
              Book Your Tour Today
            </Link>
          </div>
        </div>
      </section>

      <footer id="contact" className="border-t border-slate-200/80 bg-slate-950 text-slate-200">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr] lg:px-10">
          <div>
            <h3 className="text-2xl font-semibold text-white">ExploreBD Tours</h3>
            <p className="mt-4 max-w-md leading-8 text-slate-400">
              Premium tours, hotel bookings, transport services, and guided travel experiences
              across Bangladesh.
            </p>
            <div className="mt-6 space-y-2 text-sm text-slate-300">
              <p>Dhaka Office: Gulshan Avenue, Dhaka 1212</p>
              <p>Email: hello@explorebdtours.com</p>
              <p>Phone: +880 1700-123456</p>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white">Quick Links</h4>
            <div className="mt-5 space-y-3 text-sm text-slate-400">
              <a href="#home" className="block transition hover:text-white">
                Home
              </a>
              <Link href="/tours" className="block transition hover:text-white">
                Packages
              </Link>
              <a href="#destinations" className="block transition hover:text-white">
                Destinations
              </a>
              <a href="#about" className="block transition hover:text-white">
                About
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white">Social Media</h4>
            <div className="mt-5 space-y-3 text-sm text-slate-400">
              <Link href="/" className="block transition hover:text-white">
                Facebook
              </Link>
              <Link href="/" className="block transition hover:text-white">
                Instagram
              </Link>
              <Link href="/" className="block transition hover:text-white">
                YouTube
              </Link>
              <Link href="/" className="block transition hover:text-white">
                LinkedIn
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white">Newsletter</h4>
            <p className="mt-5 text-sm leading-7 text-slate-400">
              Get destination updates, seasonal offers, and curated travel ideas.
            </p>
            <form className="mt-5 flex flex-col gap-3 sm:flex-row lg:flex-col">
              <input
                type="email"
                placeholder="Your email address"
                className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-300"
              />
              <button className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </footer>
    </main>
  );
}
