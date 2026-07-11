import Link from "next/link";
import { MapPin, Clock, Star } from "lucide-react";
import type { TourPackageDTO } from "@/lib/tour-package";
import { formatBdt } from "@/lib/tour-package";

type Props = {
  pkg: TourPackageDTO;
  bookHref?: string;
};

export default function PackageCard({ pkg, bookHref }: Props) {
  const href = bookHref ?? `/tours/${pkg.id}`;
  const ratingRounded = Math.round(pkg.rating * 10) / 10;
  const showRating = pkg.rating > 0;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-16/10 overflow-hidden bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={pkg.imageUrl}
          alt={pkg.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {showRating ? (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-amber-700 shadow-sm backdrop-blur-sm">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            {ratingRounded}
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-teal-700">
          {pkg.duration} / {pkg.location}
        </p>
        <h3 className="mt-1 text-lg font-bold leading-snug tracking-tight text-slate-900">
          {pkg.title}
        </h3>
        <p className="mt-2 text-sm font-semibold text-slate-800">
          {pkg.duration} {pkg.location} Tour - {formatBdt(pkg.priceBdt)}
        </p>

        <p className="mt-3 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-600">
          {pkg.shortDescription}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <MapPin size={14} className="text-teal-600" />
            {pkg.location}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={14} className="text-teal-600" />
            {pkg.duration}
          </span>
        </div>

        <Link
          href={href}
          className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-teal-700 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800"
        >
          View tour
        </Link>
      </div>
    </article>
  );
}
