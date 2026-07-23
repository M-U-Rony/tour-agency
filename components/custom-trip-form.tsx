"use client";

import { useState } from "react";
import Link from "next/link";
import { useInsideSidebar } from "@/components/sidebar-context";
import {
  MapPin,
  Users,
  CalendarDays,
  MessageSquare,
  Compass,
  Banknote,
  CheckCircle,
} from "lucide-react";

const TRIP_TYPES = [
  "Adventure & Trekking",
  "Beach & Coastal",
  "Culture & Heritage",
  "Wildlife & Nature",
  "Pilgrimage & Spiritual",
  "Honeymoon & Romantic",
  "Family Holiday",
  "Corporate & Group",
] as const;

const BUDGET_RANGES = [
  "Under ৳10,000 / person",
  "৳10,000 – ৳20,000 / person",
  "৳20,000 – ৳40,000 / person",
  "৳40,000 – ৳70,000 / person",
  "Over ৳70,000 / person",
  "Flexible / Not sure yet",
] as const;

type FormState = {
  destination: string;
  additionalDestinations: string;
  tripType: string;
  departureDate: string;
  returnDate: string;
  travelers: number;
  children: number;
  budget: string;
  accommodation: string;
  notes: string;
};

const initialForm: FormState = {
  destination: "",
  additionalDestinations: "",
  tripType: "",
  departureDate: "",
  returnDate: "",
  travelers: 2,
  children: 0,
  budget: "",
  accommodation: "",
  notes: "",
};

const inputClass =
  "w-full rounded-2xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-[box-shadow,border-color,background-color] focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10";

const labelClass =
  "mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500";

export default function CustomTripForm() {
  const isInsideSidebar = useInsideSidebar();
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/custom-trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Could not submit request");
      }
      setSubmitted(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again or email us directly."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 rounded-[2rem] border border-emerald-100 bg-emerald-50/60 px-8 py-16 text-center shadow-[0_20px_60px_rgba(16,185,129,0.08)]">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle className="h-8 w-8 text-emerald-600" />
        </span>
        <h3 className="text-2xl font-semibold text-slate-900 font-[Georgia,Times_New_Roman,serif]">
          Request received!
        </h3>
        <p className="max-w-sm text-slate-600 leading-7">
          Thank you! Our travel team has received your custom trip request and will review it and reach out to you within 24 hours.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-2">
          <button
            onClick={() => { setSubmitted(false); setForm(initialForm); }}
            className="rounded-full border border-emerald-100 px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-emerald-50 cursor-pointer"
          >
            Submit another request
          </button>
          {isInsideSidebar && (
            <Link
              href="/custom-trips"
              className="rounded-full bg-teal-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-850 cursor-pointer"
            >
              View My Custom Trips
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[2rem] border border-white bg-white/85 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8"
    >
      {/* ── Section: Destination ─────────────────────── */}
      <div className="mb-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Compass className="h-5 w-5 text-teal-700" />
          Where do you want to go?
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Tell us your dream destination — even if it&apos;s not in our packages yet.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>
              <MapPin className="h-3.5 w-3.5" /> Primary destination *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Kaptai Lake, Nijhum Dwip"
              value={form.destination}
              onChange={(e) => set("destination", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              <MapPin className="h-3.5 w-3.5" /> Additional stops (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Rangamati, Cox's Bazar"
              value={form.additionalDestinations}
              onChange={(e) => set("additionalDestinations", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className={labelClass}>
            <Compass className="h-3.5 w-3.5" /> Trip type *
          </label>
          <div className="flex flex-wrap gap-2 mt-1">
            {TRIP_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => set("tripType", type)}
                className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-all ${
                  form.tripType === type
                    ? "border-teal-700 bg-teal-700 text-white shadow-sm"
                    : "border-emerald-100 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-800"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          {/* Hidden required input for trip type */}
          <input
            type="text"
            required
            value={form.tripType}
            onChange={() => {}}
            className="sr-only"
            tabIndex={-1}
            aria-label="Trip type"
          />
        </div>
      </div>

      {/* ── Section: Dates & Travelers ────────────────── */}
      <div className="mb-8 border-t border-slate-100 pt-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <CalendarDays className="h-5 w-5 text-teal-700" />
          When & how many?
        </h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>
              <CalendarDays className="h-3.5 w-3.5" /> Departure date *
            </label>
            <input
              type="date"
              required
              min={new Date().toISOString().split("T")[0]}
              value={form.departureDate}
              onChange={(e) => set("departureDate", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              <CalendarDays className="h-3.5 w-3.5" /> Return date *
            </label>
            <input
              type="date"
              required
              min={form.departureDate || new Date().toISOString().split("T")[0]}
              value={form.returnDate}
              onChange={(e) => set("returnDate", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              <Users className="h-3.5 w-3.5" /> Adults *
            </label>
            <input
              type="number"
              required
              min={1}
              max={200}
              value={form.travelers}
              onChange={(e) => set("travelers", Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              <Users className="h-3.5 w-3.5" /> Children (under 12)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={form.children}
              onChange={(e) => set("children", Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* ── Section: Budget & Accommodation ─────────── */}
      <div className="mb-8 border-t border-slate-100 pt-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Banknote className="h-5 w-5 text-teal-700" />
          Budget & accommodation
        </h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>
              <Banknote className="h-3.5 w-3.5" /> Budget range per person *
            </label>
            <div className="mt-1 flex flex-wrap gap-2">
              {BUDGET_RANGES.map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => set("budget", range)}
                  className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-all ${
                    form.budget === range
                      ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                      : "border-emerald-100 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-800"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
            <input
              type="text"
              required
              value={form.budget}
              onChange={() => {}}
              className="sr-only"
              tabIndex={-1}
              aria-label="Budget range"
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass}>
              Accommodation preference
            </label>
            <select
              value={form.accommodation}
              onChange={(e) => set("accommodation", e.target.value)}
              className={inputClass}
            >
              <option value="">Select preference (optional)</option>
              <option>Budget / Guesthouse</option>
              <option>Standard Hotel (2–3 star)</option>
              <option>Comfort Hotel (4 star)</option>
              <option>Luxury Resort (5 star)</option>
              <option>Eco / Cottage / Camp</option>
              <option>No preference</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Section: Additional Notes ────────────────── */}
      <div className="mb-8 border-t border-slate-100 pt-8">
        <label className={labelClass}>
          <MessageSquare className="h-3.5 w-3.5" /> Special requirements or notes (optional)
        </label>
        <textarea
          rows={4}
          placeholder="Any dietary needs, mobility requirements, specific interests, or anything else our team should know…"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          className={`${inputClass} resize-y mt-2`}
        />
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-2xl bg-teal-700 py-4 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(15,118,110,0.15)] transition hover:-translate-y-0.5 hover:bg-teal-800 active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer"
      >
        {submitting ? "Sending your request…" : "Send Custom Trip Request"}
      </button>
      <p className="mt-3 text-center text-xs text-slate-400">
        Our travel team typically responds within 24 hours.
      </p>
    </form>
  );
}
