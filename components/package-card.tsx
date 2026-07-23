"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Clock, Star, Calendar, Users, Heart } from "lucide-react";
import type { TourPackageDTO } from "@/lib/tour-package";
import { formatBdt, isTourUpcoming } from "@/lib/tour-package";
import { useAuthUser } from "@/hooks/use-auth-user";

type Props = {
  pkg: TourPackageDTO;
  bookHref?: string;
  isWishlisted?: boolean;
  onWishlistToggle?: (wishlisted: boolean) => void;
};

export default function PackageCard({
  pkg,
  bookHref,
  isWishlisted = false,
  onWishlistToggle,
}: Props) {
  const router = useRouter();
  const { user } = useAuthUser();
  const isAdmin = user?.role === "admin";
  const [wishlisted, setWishlisted] = useState(isWishlisted);
  const [toggling, setToggling] = useState(false);

  const href = bookHref ?? `/tours/${pkg.id}`;
  const ratingRounded = Math.round(pkg.rating * 10) / 10;
  const showRating = pkg.rating > 0;
  const upcoming = isTourUpcoming(pkg);

  const totalSeats = pkg.totalSeats ?? 20;
  const availableSeats = pkg.availableSeats ?? totalSeats;
  const isSoldOut = availableSeats <= 0;

  const formattedStart = pkg.startDate
    ? new Date(pkg.startDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const formattedEnd = pkg.endDate
    ? new Date(pkg.endDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  async function handleToggleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (toggling) return;
    setToggling(true);

    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id }),
      });

      if (res.status === 401) {
        router.push(`/signin?next=${encodeURIComponent(href)}`);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setWishlisted(data.wishlisted);
        if (onWishlistToggle) onWishlistToggle(data.wishlisted);
      }
    } catch (err) {
      console.error("Failed to toggle wishlist:", err);
    } finally {
      setToggling(false);
    }
  }

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-16/10 overflow-hidden bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={pkg.imageUrl}
          alt={pkg.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute left-3 top-3 flex items-center gap-1.5 z-10">
          {upcoming ? (
            <span className="inline-flex items-center rounded-full bg-emerald-700/90 text-white px-2.5 py-1 text-[11px] font-bold shadow-sm backdrop-blur-sm">
              Upcoming Tour
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-slate-800/85 text-slate-100 px-2.5 py-1 text-[11px] font-bold shadow-sm backdrop-blur-sm">
              Past Tour
            </span>
          )}
          {isSoldOut && (
            <span className="inline-flex items-center rounded-full bg-red-600/90 text-white px-2.5 py-1 text-[11px] font-bold shadow-sm backdrop-blur-sm">
              Sold Out
            </span>
          )}
        </div>

        <div className="absolute right-3 top-3 flex items-center gap-2 z-10">
          {!isAdmin && (
            <button
              type="button"
              onClick={handleToggleWishlist}
              title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md backdrop-blur-sm transition-transform active:scale-95 hover:bg-white cursor-pointer"
            >
              <Heart
                size={17}
                className={
                  wishlisted
                    ? "fill-rose-500 text-rose-500 transition-colors"
                    : "text-slate-600 hover:text-rose-500 transition-colors"
                }
              />
            </button>
          )}
          {showRating ? (
            <div className="flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-amber-700 shadow-sm backdrop-blur-sm">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              {ratingRounded}
            </div>
          ) : null}
        </div>
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
          <span className="inline-flex items-center gap-1 font-medium">
            <Users size={13} className={isSoldOut ? "text-red-500" : "text-teal-600"} />
            {isSoldOut ? (
              <span className="font-bold text-red-600">Sold Out</span>
            ) : (
              <span>{availableSeats} / {totalSeats} seats</span>
            )}
          </span>
          {formattedStart ? (
            <span className="inline-flex items-center gap-1 font-medium text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
              <Calendar size={12} className="text-teal-600" />
              <span>{formattedStart}{formattedEnd ? ` — ${formattedEnd}` : ""}</span>
            </span>
          ) : null}
        </div>

        <Link
          href={href}
          className={`mt-5 inline-flex w-full items-center justify-center rounded-xl py-3 text-sm font-semibold text-white shadow-sm transition-colors ${
            isSoldOut
              ? "bg-slate-500 hover:bg-slate-600"
              : "bg-teal-700 hover:bg-teal-800"
          }`}
        >
          {isSoldOut ? "View Details (Sold Out)" : "View tour"}
        </Link>
      </div>
    </article>
  );
}
