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
};

type FormState = typeof emptyForm;

export default function AdminPackagesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthUser();
  const [packages, setPackages] = useState<TourPackageDTO[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );
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
    setForm({
      title: pkg.title,
      location: pkg.location,
      duration: pkg.duration,
      priceBdt: String(pkg.priceBdt),
      shortDescription: pkg.shortDescription,
      imageUrl: pkg.imageUrl,
    });
    setMessage(null);
    formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage(null);
  }

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
      setMessage({ type: "ok", text: "Image uploaded. You can publish or save when ready." });
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
        `Delete "${pkg.title}"? This will not remove existing bookings.`
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  const isEditing = editingId !== null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/25">
              <Plane className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Admin
              </p>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                Tours & packages
              </h1>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-3 text-sm font-medium">
            <Link
              href="/admin/dashboard"
              className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Dashboard
            </Link>
            <span className="rounded-lg bg-indigo-50 px-3 py-2 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
              Packages
            </span>
            <Link
              href="/admin/bookings"
              className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Bookings
            </Link>
            <Link
              href="/tours"
              className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Public page
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <section
          ref={formSectionRef}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-8"
        >
          <div className="mb-6 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              {isEditing ? (
                <Pencil className="mt-1 h-5 w-5 shrink-0 text-indigo-600" />
              ) : (
                <PlusCircle className="mt-1 h-5 w-5 shrink-0 text-indigo-600" />
              )}
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {isEditing ? "Edit package" : "Add a new package"}
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Upload an image file, then set title, location, duration, and price (BDT).
                  Example title:{" "}
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    3 Days Cox&apos;s Bazar Tour
                  </span>
                </p>
              </div>
            </div>
            {isEditing && (
              <button
                type="button"
                onClick={cancelEdit}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                <X size={14} /> Cancel edit
              </button>
            )}
          </div>

          {message && (
            <div
              className={`mb-6 rounded-xl border px-4 py-3 text-sm font-medium ${
                message.type === "ok"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                  : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-[box-shadow,border-color] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="Cox's Bazar"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </label>

            <label>
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Duration
              </span>
              <input
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="3 Days"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="5000"
                value={form.priceBdt}
                onChange={(e) => setForm({ ...form, priceBdt: e.target.value })}
              />
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
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  <ImagePlus size={18} className="text-indigo-600" />
                  {uploadingImage ? "Uploading…" : "Choose image from computer"}
                </button>
                {form.imageUrl ? (
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[min(100%,280px)]">
                    {form.imageUrl.replace(/^\/uploads\/packages\//, "")}
                  </span>
                ) : null}
              </div>
              {form.imageUrl ? (
                <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.imageUrl}
                    alt=""
                    className="h-24 w-36 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, imageUrl: "" }))}
                    className="text-xs font-semibold text-red-600 hover:underline dark:text-red-400"
                  >
                    Remove image
                  </button>
                </div>
              ) : null}
            </div>

            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Short description
              </span>
              <textarea
                required
                rows={3}
                className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="Sea-facing hotels, local seafood, and sunset at Laboni Beach."
                value={form.shortDescription}
                onChange={(e) =>
                  setForm({ ...form, shortDescription: e.target.value })
                }
              />
            </label>

            <div className="sm:col-span-2 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 transition-colors hover:bg-indigo-700 disabled:opacity-60 dark:hover:bg-indigo-500"
              >
                {submitting
                  ? isEditing
                    ? "Saving…"
                    : "Publishing…"
                  : isEditing
                    ? "Save changes"
                    : "Publish package"}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="mt-12">
          <h2 className="mb-6 text-xl font-bold text-slate-900 dark:text-white">
            Published packages
          </h2>
          {loadingList ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            </div>
          ) : packages.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
              No packages yet. Add one using the form above.
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
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="relative aspect-16/10 overflow-hidden bg-slate-100 dark:bg-slate-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={pkg.imageUrl} alt={pkg.title} className="h-full w-full object-cover" />
        {showRating ? (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-amber-700 shadow-sm dark:bg-slate-900/90 dark:text-amber-400">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            {ratingRounded}
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
          {pkg.duration} · {pkg.location}
        </p>
        <h3 className="mt-1 text-lg font-bold leading-snug tracking-tight text-slate-900 dark:text-slate-50">
          {pkg.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
          {pkg.shortDescription}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <MapPin size={14} className="text-indigo-500" />
            {pkg.location}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={14} className="text-indigo-500" />
            {pkg.duration}
          </span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {formatBdt(pkg.priceBdt)}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={`/tours/${pkg.id}`}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            Preview
          </Link>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300"
          >
            <Pencil size={12} /> Edit
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={onDelete}
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
          >
            <Trash2 size={12} /> {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </article>
  );
}
