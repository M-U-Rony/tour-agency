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
  startDate: "",
  endDate: "",
  totalSeats: "20",
  availableSeats: "20",
  tourGuideId: "",
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
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [tourGuides, setTourGuides] = useState<{ id: number; name: string; email: string }[]>([]);
  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const formSectionRef = useRef<HTMLElement | null>(null);

  const isEditing = editingPkg !== null;

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/tour-guides", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setTourGuides(data.guides ?? []);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (editingPkg) {
      const total = editingPkg.totalSeats ?? 20;
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
        startDate: editingPkg.startDate
          ? new Date(editingPkg.startDate).toISOString().slice(0, 16)
          : "",
        endDate: editingPkg.endDate
          ? new Date(editingPkg.endDate).toISOString().slice(0, 16)
          : "",
        totalSeats: String(total),
        availableSeats: String(editingPkg.availableSeats ?? total),
        tourGuideId: editingPkg.tourGuideId ? String(editingPkg.tourGuideId) : "",
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
        text: "Main cover image uploaded.",
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

  async function handleGalleryFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    e.target.value = "";
    if (!files || files.length === 0) return;
    setMessage(null);
    setUploadingGallery(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("files", f));
      const res = await fetch("/api/upload/package-image", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const data = (await res.json()) as { urls?: string[]; url?: string; message?: string };
      if (!res.ok) {
        throw new Error(data.message || "Upload failed");
      }
      const newUrls = data.urls ?? (data.url ? [data.url] : []);
      if (newUrls.length === 0) throw new Error("Invalid response");
      const current = splitLines(form.galleryUrls);
      const combined = Array.from(new Set([...current, ...newUrls])).join("\n");
      setForm((prev) => ({ ...prev, galleryUrls: combined }));
      setMessage({
        type: "ok",
        text: `${newUrls.length} destination gallery photo(s) uploaded.`,
      });
    } catch (err: unknown) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Could not upload destination photos",
      });
    } finally {
      setUploadingGallery(false);
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
      startDate: form.startDate,
      endDate: form.endDate,
      totalSeats: Number(form.totalSeats),
      availableSeats: Number(form.availableSeats),
      tourGuideId: form.tourGuideId ? Number(form.tourGuideId) : null,
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
        let errMsg = data.message || "Could not save package";
        if (data.issues?.fieldErrors) {
          const details = Object.entries(data.issues.fieldErrors)
            .map(([field, errors]: any) => `${field}: ${Array.isArray(errors) ? errors.join(", ") : errors}`)
            .join("; ");
          if (details) errMsg += `: ${details}`;
        }
        throw new Error(errMsg);
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
                Remove main image
              </button>
            </div>
          ) : null}
        </div>

        <div className="sm:col-span-2 space-y-3 border-t border-emerald-100/80 pt-4">
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              More Destination Gallery Photos
            </span>
            <p className="mt-0.5 text-xs text-slate-500">
              Upload additional photos of the destination to show in the package image gallery.
            </p>
          </div>
          <input
            ref={galleryInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => void handleGalleryFilesChange(e)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={uploadingGallery}
              onClick={() => galleryInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-[#f4fbf8] disabled:opacity-60 cursor-pointer"
            >
              <ImagePlus size={18} className="text-teal-700" />
              {uploadingGallery ? "Uploading photos..." : "Upload destination photos"}
            </button>
            {splitLines(form.galleryUrls).length > 0 && (
              <span className="text-xs font-medium text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
                {splitLines(form.galleryUrls).length} photo(s) added
              </span>
            )}
          </div>

          {splitLines(form.galleryUrls).length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
              {splitLines(form.galleryUrls).map((url, idx) => (
                <div key={url + idx} className="group relative aspect-4/3 overflow-hidden rounded-xl border border-emerald-100 bg-[#f4fbf8]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = splitLines(form.galleryUrls).filter((_, i) => i !== idx).join("\n");
                      setForm((prev) => ({ ...prev, galleryUrls: updated }));
                    }}
                    title="Remove photo"
                    className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/80 text-white shadow-md transition-transform hover:bg-red-600 active:scale-95 cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
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

        <label>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Start Date & Time
          </span>
          <input
            type="datetime-local"
            className="w-full rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 outline-none transition-[box-shadow,border-color] focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
        </label>

        <label>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            End Date & Time
          </span>
          <input
            type="datetime-local"
            className="w-full rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 outline-none transition-[box-shadow,border-color] focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />
        </label>

        <label>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Seats *
          </span>
          <input
            type="number"
            min={1}
            required
            className="w-full rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 outline-none transition-[box-shadow,border-color] focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            placeholder="20"
            value={form.totalSeats}
            onChange={(e) => setForm({ ...form, totalSeats: e.target.value })}
          />
        </label>

        <label>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Available Seats *
          </span>
          <input
            type="number"
            min={0}
            required
            className="w-full rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 outline-none transition-[box-shadow,border-color] focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            placeholder="20"
            value={form.availableSeats}
            onChange={(e) => setForm({ ...form, availableSeats: e.target.value })}
          />
        </label>

        <label className="sm:col-span-2">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Assign Tour Guide (Optional)
          </span>
          <select
            value={form.tourGuideId}
            onChange={(e) => setForm({ ...form, tourGuideId: e.target.value })}
            className="w-full rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 outline-none transition-[box-shadow,border-color] focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 cursor-pointer"
          >
            <option value="">-- No guide assigned yet --</option>
            {tourGuides.map((guide) => (
              <option key={guide.id} value={guide.id}>
                {guide.name} ({guide.email})
              </option>
            ))}
          </select>
          {tourGuides.length === 0 && (
            <p className="mt-1.5 text-xs text-slate-500">
              No tour guides available yet. You can promote users to Tour Guides from the <strong>Tour Guides</strong> section in the admin sidebar.
            </p>
          )}
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
