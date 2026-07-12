"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Pencil, PlusCircle, X } from "lucide-react";
import type { TourPackageDTO } from "@/lib/tour-package";

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

type PackageFormProps = {
  editingPkg: TourPackageDTO | null;
  onSuccess: () => void;
  onCancel: () => void;
};

export default function PackageForm({
  editingPkg,
  onSuccess,
  onCancel,
}: PackageFormProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const formSectionRef = useRef<HTMLElement | null>(null);

  const isEditing = editingPkg !== null;

  useEffect(() => {
    if (editingPkg) {
      setForm({
        title: editingPkg.title,
        location: editingPkg.location,
        duration: editingPkg.duration,
        priceBdt: String(editingPkg.priceBdt),
        shortDescription: editingPkg.shortDescription,
        imageUrl: editingPkg.imageUrl,
        galleryUrls: (editingPkg.galleryUrls ?? []).join("\n"),
        itinerary: (editingPkg.itinerary ?? []).join("\n"),
        inclusions: (editingPkg.inclusions ?? []).join("\n"),
        exclusions: (editingPkg.exclusions ?? []).join("\n"),
        pickupInfo: editingPkg.pickupInfo ?? "",
        cancellationPolicy: editingPkg.cancellationPolicy ?? "",
        availableDates: (editingPkg.availableDates ?? [])
          .map((d) => new Date(d).toISOString().slice(0, 10))
          .join("\n"),
        maxTravelers: String(editingPkg.maxTravelers ?? 20),
        isActive: editingPkg.isActive ?? true,
      });
      setMessage(null);
    } else {
      setForm(emptyForm);
      setMessage(null);
    }
  }, [editingPkg]);

  useEffect(() => {
    formSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [editingPkg]);

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
      const url = isEditing
        ? `/api/tour-packages/${editingPkg.id}`
        : "/api/tour-packages";
      const res = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Could not save package");
      }
      onSuccess();
    } catch (err: unknown) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
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
              Upload an image file, then set title, location, duration, and price (BDT).
            </p>
          </div>
        </div>
        {isEditing && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-100 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-[#f4fbf8] cursor-pointer"
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
            className="w-full rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 outline-none transition-[box-shadow,border-color] focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
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
            className="w-full rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 outline-none transition-[box-shadow,border-color] focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
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
            className="w-full rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 outline-none transition-[box-shadow,border-color] focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
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
            className="w-full rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 outline-none transition-[box-shadow,border-color] focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            placeholder="5000"
            value={form.priceBdt}
            onChange={(e) => setForm({ ...form, priceBdt: e.target.value })}
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
            className="w-full rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 outline-none transition-[box-shadow,border-color] focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            value={form.maxTravelers}
            onChange={(e) => setForm({ ...form, maxTravelers: e.target.value })}
          />
        </label>

        <label className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            className="h-4 w-4 rounded border-emerald-300 text-teal-600 focus:ring-emerald-500"
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
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-[#f4fbf8] disabled:opacity-60 cursor-pointer"
            >
              <ImagePlus size={18} className="text-teal-700" />
              {uploadingImage ? "Uploading..." : "Choose image from computer"}
            </button>
            {form.imageUrl ? (
              <span className="text-xs text-slate-500 truncate max-w-[min(100%,280px)]">
                {form.imageUrl.replace(/^\/upload\//, "").replace(/^\/uploads\/packages\//, "")}
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
                onClick={() => setForm((prev) => ({ ...prev, imageUrl: "" }))}
                className="text-xs font-semibold text-red-600 hover:underline cursor-pointer"
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
            className="w-full resize-y rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 outline-none transition-[box-shadow,border-color] focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            placeholder="One image URL or uploaded path per line"
            value={form.galleryUrls}
            onChange={(e) => setForm({ ...form, galleryUrls: e.target.value })}
          />
        </label>

        <label className="sm:col-span-2">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Short description
          </span>
          <textarea
            required
            rows={3}
            className="w-full resize-y rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 outline-none transition-[box-shadow,border-color] focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            placeholder="Sea-facing hotels, local seafood, and sunset at Laboni Beach."
            value={form.shortDescription}
            onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
          />
        </label>

        <label className="sm:col-span-2">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Itinerary steps
          </span>
          <textarea
            rows={4}
            className="w-full resize-y rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 outline-none transition-[box-shadow,border-color] focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            placeholder="One step per line"
            value={form.itinerary}
            onChange={(e) => setForm({ ...form, itinerary: e.target.value })}
          />
        </label>

        <label>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Inclusions
          </span>
          <textarea
            rows={4}
            className="w-full resize-y rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 outline-none transition-[box-shadow,border-color] focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            placeholder="One item per line"
            value={form.inclusions}
            onChange={(e) => setForm({ ...form, inclusions: e.target.value })}
          />
        </label>

        <label>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Exclusions
          </span>
          <textarea
            rows={4}
            className="w-full resize-y rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 outline-none transition-[box-shadow,border-color] focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            placeholder="One item per line"
            value={form.exclusions}
            onChange={(e) => setForm({ ...form, exclusions: e.target.value })}
          />
        </label>

        <label>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Pickup info
          </span>
          <textarea
            rows={3}
            className="w-full resize-y rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 outline-none transition-[box-shadow,border-color] focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            placeholder="Airport or bus station pickup details"
            value={form.pickupInfo}
            onChange={(e) => setForm({ ...form, pickupInfo: e.target.value })}
          />
        </label>

        <label>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Cancellation policy
          </span>
          <textarea
            rows={3}
            className="w-full resize-y rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 outline-none transition-[box-shadow,border-color] focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            placeholder="Refund policy details"
            value={form.cancellationPolicy}
            onChange={(e) => setForm({ ...form, cancellationPolicy: e.target.value })}
          />
        </label>

        <label className="sm:col-span-2">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Available dates
          </span>
          <textarea
            rows={3}
            className="w-full resize-y rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 outline-none transition-[box-shadow,border-color] focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            placeholder="YYYY-MM-DD, one date per line"
            value={form.availableDates}
            onChange={(e) => setForm({ ...form, availableDates: e.target.value })}
          />
        </label>

        <div className="sm:col-span-2 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-teal-700 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-teal-900/20 transition-colors hover:bg-teal-800 disabled:opacity-60 cursor-pointer"
          >
            {submitting
              ? isEditing
                ? "Saving..."
                : "Publishing..."
              : isEditing
              ? "Save changes"
              : "Publish package"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-emerald-100 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-[#f4fbf8] cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
