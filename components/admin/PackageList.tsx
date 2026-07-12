"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, MapPin, Pencil, Star, Trash2 } from "lucide-react";
import type { TourPackageDTO } from "@/lib/tour-package";
import { formatBdt } from "@/lib/tour-package";

type PackageListProps = {
  packages: TourPackageDTO[];
  loading: boolean;
  onEdit: (pkg: TourPackageDTO) => void;
  onDeleteSuccess: () => void;
};

export default function PackageList({
  packages,
  loading,
  onEdit,
  onDeleteSuccess,
}: PackageListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function deletePackage(pkg: TourPackageDTO) {
    if (
      !window.confirm(
        `Delete "${pkg.title}"? This will not remove existing bookings.`,
      )
    ) {
      return;
    }
    setDeletingId(pkg.id);
    setError(null);
    try {
      const res = await fetch(`/api/tour-packages/${pkg.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Could not delete");
      }
      onDeleteSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-t-transparent" />
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-emerald-200 bg-white px-6 py-14 text-center text-sm text-slate-500">
        No packages yet. Add one using the button above.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => (
          <AdminPackageCard
            key={pkg.id}
            pkg={pkg}
            onEdit={() => onEdit(pkg)}
            onDelete={() => void deletePackage(pkg)}
            deleting={deletingId === pkg.id}
          />
        ))}
      </div>
    </div>
  );
}

function AdminPackageCard({
  pkg,
  onEdit,
  onDelete,
  deleting,
}: {
  pkg: TourPackageDTO;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const ratingRounded = Math.round(pkg.rating * 10) / 10;
  const showRating = pkg.rating > 0;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={pkg.imageUrl}
          alt={pkg.title}
          className="h-full w-full object-cover"
        />
        {showRating ? (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-amber-700 shadow-sm">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            {ratingRounded}
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-teal-700">
          {pkg.duration} / {pkg.location}
        </p>
        <h3 className="mt-1 text-lg font-bold leading-snug tracking-tight text-slate-900 line-clamp-1">
          {pkg.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-slate-600">
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
          <span className="font-semibold text-slate-700">
            {formatBdt(pkg.priceBdt)}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={`/tours/${pkg.id}`}
            className="rounded-lg border border-emerald-100 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-[#f4fbf8]"
          >
            Preview
          </Link>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100 cursor-pointer"
          >
            <Pencil size={12} /> Edit
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={onDelete}
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60 cursor-pointer"
          >
            <Trash2 size={12} /> {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </article>
  );
}
