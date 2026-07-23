"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Compass } from "lucide-react";
import type { TourPackageDTO } from "@/lib/tour-package";
import PackageCard from "@/components/package-card";

export default function WishlistView() {
  const [packages, setPackages] = useState<TourPackageDTO[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadWishlist() {
    setLoading(true);
    try {
      const res = await fetch("/api/wishlist", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setPackages(data.packages ?? []);
      }
    } catch {
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadWishlist();
  }, []);

  function handleWishlistToggle(packageId: string, wishlisted: boolean) {
    if (!wishlisted) {
      setPackages((prev) => prev.filter((p) => p.id !== packageId));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-100 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Heart className="fill-rose-500 text-rose-500" size={24} /> My Saved Wishlist
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            All your bookmarked tour packages saved in one place for quick access.
          </p>
        </div>
        <span className="self-start sm:self-auto rounded-full bg-rose-50 px-3.5 py-1 text-xs font-bold text-rose-700 border border-rose-100">
          {packages.length} {packages.length === 1 ? "Package" : "Packages"} Saved
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-t-transparent" />
        </div>
      ) : packages.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-emerald-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500">
            <Heart size={28} />
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900">Your wishlist is empty</h3>
          <p className="mt-1.5 text-sm text-slate-600 max-w-md mx-auto">
            You haven&apos;t saved any tour packages yet. Browse our curated tours and click the heart icon on any package to save it here!
          </p>
          <div className="mt-6">
            <Link
              href="/tours"
              className="inline-flex items-center gap-2 rounded-xl bg-teal-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-900 shadow-sm"
            >
              <Compass size={18} />
              Explore Tour Packages
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              isWishlisted={true}
              onWishlistToggle={(wishlisted) => handleWishlistToggle(pkg.id, wishlisted)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
