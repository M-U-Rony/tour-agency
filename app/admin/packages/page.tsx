"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  ImagePlus,
  MapPin,
  Pencil,
  Plane,
  PlusCircle,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import type { TourPackageDTO } from "@/lib/tour-package";
import { formatBdt } from "@/lib/tour-package";

const emptyForm = {
  title: "",
  location: "",
  duration: "",
  priceBdt: "",
  shortDescription: "",
  imageUrl: "",
  galleryUrls: "",
  itinerary: "",
  inclusions: "",
  exclusions: "",
  pickupInfo: "",
  cancellationPolicy: "",
  availableDates: "",
  maxTravelers: "20",
  isActive: true,
};

type FormState = typeof emptyForm;

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function AdminPackagesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthUser();
  const [packages, setPackages] = useState<TourPackageDTO[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const formSectionRef = useRef<HTMLElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadPackages = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch("/api/tour-packages");
      if (!res.ok) throw new Error("Failed to load packages");
      const data = (await res.json()) as { packages: TourPackageDTO[] };
      setPackages(data.packages ?? []);
    } catch {
      setPackages([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/signin");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!authLoading && user?.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user?.role === "admin") {
      void loadPackages();
    }
  }, [user?.role, loadPackages]);

  function startEdit(pkg: TourPackageDTO) {
    setEditingId(pkg.id);
    setShowForm(true);
    setForm({
      title: pkg.title,
      location: pkg.location,
      duration: pkg.duration,
      priceBdt: String(pkg.priceBdt),
      shortDescription: pkg.shortDescription,
      imageUrl: pkg.imageUrl,
      galleryUrls: (pkg.galleryUrls ?? []).join("\n"),
      itinerary: (pkg.itinerary ?? []).join("\n"),
      inclusions: (pkg.inclusions ?? []).join("\n"),
      exclusions: (pkg.exclusions ?? []).join("\n"),
      pickupInfo: pkg.pickupInfo ?? "",
      cancellationPolicy: pkg.cancellationPolicy ?? "",
      availableDates: (pkg.availableDates ?? [])
        .map((d) => new Date(d).toISOString().slice(0, 10))
        .join("\n"),
      maxTravelers: String(pkg.maxTravelers ?? 20),
      isActive: pkg.isActive ?? true,
    });
    setMessage(null);
    formSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage(null);
    setShowForm(false);
  }

  function openAddPackageForm() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage(null);
    setShowForm(true);
  }

  useEffect(() => {
    if (showForm) {
      formSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [showForm]);

  async function handleImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMessage(null);
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/package-image", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const data = (await res.json()) as { url?: string; message?: string };
      if (!res.ok) {
        throw new Error(data.message || "Upload failed");
      }
      if (!data.url) throw new Error("Invalid response");
      setForm((prev) => ({ ...prev, imageUrl: data.url! }));
      setMessage({
        type: "ok",
        text: "Image uploaded. You can publish or save when ready.",
      });
    } catch (err: unknown) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Could not upload image",
      });
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!form.imageUrl.trim()) {
      setMessage({
        type: "err",
        text: "Choose a package image from your computer.",
      });
      return;
    }

    setSubmitting(true);

    const priceBdt = Number(form.priceBdt);

    const payload = {
      title: form.title.trim(),
      location: form.location.trim(),
      duration: form.duration.trim(),
      priceBdt,
      shortDescription: form.shortDescription.trim(),
      imageUrl: form.imageUrl.trim(),
      galleryUrls: splitLines(form.galleryUrls),
      itinerary: splitLines(form.itinerary),
      inclusions: splitLines(form.inclusions),
      exclusions: splitLines(form.exclusions),
      pickupInfo: form.pickupInfo.trim(),
      cancellationPolicy: form.cancellationPolicy.trim(),
      availableDates: splitLines(form.availableDates),
      maxTravelers: Number(form.maxTravelers),
      isActive: form.isActive,
    };

    try {
      const url = editingId
        ? `/api/tour-packages/${editingId}`
        : "/api/tour-packages";
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Could not save package");
      }
      setMessage({
        type: "ok",
        text: editingId ? "Package updated." : "Package published.",
      });
      cancelEdit();
      await loadPackages();
    } catch (err: unknown) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function deletePackage(pkg: TourPackageDTO) {
    if (
      !window.confirm(
        `Delete "${pkg.title}"? This will not remove existing bookings.`,
      )
    ) {
      return;
    }
    setDeletingId(pkg.id);
    try {
      const res = await fetch(`/api/tour-packages/${pkg.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Could not delete");
      }
      setMessage({ type: "ok", text: "Package deleted." });
      if (editingId === pkg.id) cancelEdit();
      await loadPackages();
    } catch (err: unknown) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setDeletingId(null);
    }
  }

  if (authLoading || !user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4fbf8]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-t-transparent" />
      </div>
    );
  }

  const isEditing = editingId !== null;
  const isFormVisible = showForm || isEditing;

  return (
    <div className="min-h-screen bg-[#f4fbf8]">
      <header className="sticky top-0 z-10 border-b border-emerald-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-900">
              <Plane className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                Admin
              </p>
              <h1 className="text-lg font-bold text-slate-900">
                Tours & packages
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
            <nav className="flex flex-wrap items-center gap-3 text-sm font-medium">
              <Link
                href="/admin/dashboard"
                className="rounded-lg px-3 py-2 text-slate-600 hover:bg-emerald-50"
              >
                Dashboard
              </Link>
              <span className="rounded-lg bg-teal-50 px-3 py-2 text-teal-800">
                Packages
              </span>
              <Link
                href="/admin/bookings"
                className="rounded-lg px-3 py-2 text-slate-600 hover:bg-emerald-50"
              >
                Bookings
              </Link>
              <Link
                href="/admin/custom-trips"
                className="rounded-lg px-3 py-2 text-slate-600 hover:bg-emerald-50"
              >
                Custom trips
              </Link>
              <Link
                href="/tours"
                className="rounded-lg px-3 py-2 text-slate-600 hover:bg-emerald-50"
              >
                Public page
              </Link>
            </nav>
            <button
              type="button"
              onClick={openAddPackageForm}
              className="inline-flex items-center justify-center rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-teal-900/20 transition-colors hover:bg-teal-800"
            >
              Add package
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {isFormVisible ? (
          <section
            ref={formSectionRef}
            className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="mb-6 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {isEditing ? (
                  <Pencil className="mt-1 h-5 w-5 shrink-0 text-teal-700" />
                ) : (
                  <PlusCircle className="mt-1 h-5 w-5 shrink-0 text-teal-700" />
                )}
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {isEditing ? "Edit package" : "Add a new package"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Upload an image file, then set title, location, duration,
                    and price (BDT). Example title:{" "}
                    <span className="font-medium text-slate-800">
                      3 Days Cox&apos;s Bazar Tour
                    </span>
                  </p>
                </div>
              </div>
              {isEditing && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-100 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-[#f4fbf8]"
                >
                  <X size={14} /> Cancel edit
                </button>
              )}
            </div>

            {message && (
              <div
                className={`mb-6 rounded-xl border px-4 py-3 text-sm font-medium ${
                  message.type === "ok"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Package title
                </span>
                <input
                  required
                  className="w-full rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 outline-none transition-[box-shadow,border-color] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="e.g. 3 Days Cox's Bazar Tour"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Location
                </span>
                <input
                  required
                  className="w-full rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Cox's Bazar"
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                />
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Duration
                </span>
                <input
                  required
                  className="w-full rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="3 Days"
                  value={form.duration}
                  onChange={(e) =>
                    setForm({ ...form, duration: e.target.value })
                  }
                />
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Price (BDT)
                </span>
                <input
                  required
                  type="number"
                  min={1}
                  step={1}
                  className="w-full rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="5000"
                  value={form.priceBdt}
                  onChange={(e) =>
                    setForm({ ...form, priceBdt: e.target.value })
                  }
                />
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Max travelers
                </span>
                <input
                  required
                  type="number"
                  min={1}
                  step={1}
                  className="w-full rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  value={form.maxTravelers}
                  onChange={(e) =>
                    setForm({ ...form, maxTravelers: e.target.value })
                  }
                />
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                  className="h-4 w-4 accent-teal-700"
                />
                <span className="text-sm font-semibold text-slate-700">
                  Show this package publicly
                </span>
              </label>

              <div className="sm:col-span-2 space-y-3">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Package image
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  onChange={(e) => void handleImageFileChange(e)}
                />
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={uploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-[#f4fbf8] disabled:opacity-60"
                  >
                    <ImagePlus size={18} className="text-teal-700" />
                    {uploadingImage
                      ? "Uploading..."
                      : "Choose image from computer"}
                  </button>
                  {form.imageUrl ? (
                    <span className="text-xs text-slate-500 truncate max-w-[min(100%,280px)]">
                      {form.imageUrl.replace(/^\/uploads\/packages\//, "")}
                    </span>
                  ) : null}
                </div>
                {form.imageUrl ? (
                  <div className="flex items-start gap-4 rounded-xl border border-emerald-100 bg-[#f4fbf8] p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.imageUrl}
                      alt=""
                      className="h-24 w-36 rounded-lg object-cover border border-emerald-100"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({ ...prev, imageUrl: "" }))
                      }
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      Remove image
                    </button>
                  </div>
                ) : null}
              </div>

              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Gallery image URLs
                </span>
                <textarea
                  rows={3}
                  className="w-full resize-y rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="One image URL or uploaded path per line"
                  value={form.galleryUrls}
                  onChange={(e) =>
                    setForm({ ...form, galleryUrls: e.target.value })
                  }
                />
              </label>

              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Short description
                </span>
                <textarea
                  required
                  rows={3}
                  className="w-full resize-y rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Sea-facing hotels, local seafood, and sunset at Laboni Beach."
                  value={form.shortDescription}
                  onChange={(e) =>
                    setForm({ ...form, shortDescription: e.target.value })
                  }
                />
              </label>

              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Itinerary steps
                </span>
                <textarea
                  rows={4}
                  className="w-full resize-y rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="One step per line"
                  value={form.itinerary}
                  onChange={(e) =>
                    setForm({ ...form, itinerary: e.target.value })
                  }
                />
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Inclusions
                </span>
                <textarea
                  rows={4}
                  className="w-full resize-y rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="One item per line"
                  value={form.inclusions}
                  onChange={(e) =>
                    setForm({ ...form, inclusions: e.target.value })
                  }
                />
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Exclusions
                </span>
                <textarea
                  rows={4}
                  className="w-full resize-y rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="One item per line"
                  value={form.exclusions}
                  onChange={(e) =>
                    setForm({ ...form, exclusions: e.target.value })
                  }
                />
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Pickup info
                </span>
                <textarea
                  rows={3}
                  className="w-full resize-y rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  value={form.pickupInfo}
                  onChange={(e) =>
                    setForm({ ...form, pickupInfo: e.target.value })
                  }
                />
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Cancellation policy
                </span>
                <textarea
                  rows={3}
                  className="w-full resize-y rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  value={form.cancellationPolicy}
                  onChange={(e) =>
                    setForm({ ...form, cancellationPolicy: e.target.value })
                  }
                />
              </label>

              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Available dates
                </span>
                <textarea
                  rows={3}
                  className="w-full resize-y rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="YYYY-MM-DD, one date per line"
                  value={form.availableDates}
                  onChange={(e) =>
                    setForm({ ...form, availableDates: e.target.value })
                  }
                />
              </label>

              <div className="sm:col-span-2 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-teal-700 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-teal-900/20 transition-colors hover:bg-teal-800 disabled:opacity-60"
                >
                  {submitting
                    ? isEditing
                      ? "Saving..."
                      : "Publishing..."
                    : isEditing
                      ? "Save changes"
                      : "Publish package"}
                </button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="rounded-xl border border-emerald-100 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-[#f4fbf8]"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>
        ) : null}

        <section className="mt-12">
          <h2 className="mb-6 text-xl font-bold text-slate-900">
            Published packages
          </h2>
          {loadingList ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-t-transparent" />
            </div>
          ) : packages.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-emerald-200 bg-white px-6 py-14 text-center text-sm text-slate-500">
              No packages yet. Add one using the button above.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg) => (
                <AdminPackageCard
                  key={pkg.id}
                  pkg={pkg}
                  onEdit={() => startEdit(pkg)}
                  onDelete={() => void deletePackage(pkg)}
                  deleting={deletingId === pkg.id}
                />
              ))}
            </div>
          )}
        </section>
      </main>
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
    <article className="flex flex-col overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
      <div className="relative aspect-16/10 overflow-hidden bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={pkg.imageUrl}
          alt={pkg.title}
          className="h-full w-full object-cover"
        />
        {showRating ? (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-amber-700 shadow-sm">
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
            className="inline-flex items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100"
          >
            <Pencil size={12} /> Edit
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={onDelete}
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
          >
            <Trash2 size={12} /> {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </article>
  );
}
