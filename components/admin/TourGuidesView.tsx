"use client";

import { useEffect, useState } from "react";
import { UserCheck, UserMinus, Search, Loader2, Mail, CalendarDays } from "lucide-react";

type GuideUser = {
  id: number;
  name: string;
  email: string;
  profileImage: string;
  createdAt: string;
};

export default function TourGuidesView() {
  const [guides, setGuides] = useState<GuideUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function loadGuides() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tour-guides", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setGuides(data.guides ?? []);
      }
    } catch {
      setGuides([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadGuides(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const email = emailInput.trim().toLowerCase();
    if (!email) return;
    setMessage(null);
    setAdding(true);
    try {
      const res = await fetch("/api/admin/tour-guides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: data.message ?? "Failed to add tour guide." });
        return;
      }
      setMessage({ type: "ok", text: `${data.guide?.name ?? email} has been added as a tour guide.` });
      setEmailInput("");
      await loadGuides();
    } catch {
      setMessage({ type: "err", text: "Network error. Please try again." });
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(guide: GuideUser) {
    setMessage(null);
    setRemovingEmail(guide.email);
    try {
      const res = await fetch("/api/admin/tour-guides", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: guide.email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: data.message ?? "Failed to remove tour guide." });
        return;
      }
      setMessage({ type: "ok", text: `${guide.name} has been removed from tour guides.` });
      await loadGuides();
    } catch {
      setMessage({ type: "err", text: "Network error. Please try again." });
    } finally {
      setRemovingEmail(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-100 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <UserCheck className="text-teal-700" size={26} />
            Tour Guides
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Assign registered users as tour guides. Enter their registered email to promote them.
          </p>
        </div>
        <span className="self-start sm:self-auto rounded-full bg-teal-50 px-4 py-1.5 text-xs font-bold text-teal-800 border border-teal-100">
          {guides.length} {guides.length === 1 ? "Guide" : "Guides"}
        </span>
      </div>

      {/* Add Tour Guide Form */}
      <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-slate-800 flex items-center gap-2">
          <Search size={16} className="text-teal-700" />
          Add a User as Tour Guide
        </h3>
        <form onSubmit={(e) => void handleAdd(e)} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="email"
              required
              placeholder="Enter user's email address (Gmail or any)"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full rounded-xl border border-emerald-100 bg-[#f4fbf8] py-3 pl-9 pr-4 text-sm text-slate-900 outline-none transition-[box-shadow,border-color] focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>
          <button
            type="submit"
            disabled={adding || !emailInput.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 disabled:opacity-60 cursor-pointer"
          >
            {adding ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
            {adding ? "Adding..." : "Add as Tour Guide"}
          </button>
        </form>

        {message && (
          <div
            className={`mt-3 rounded-xl border px-4 py-3 text-sm font-medium ${
              message.type === "ok"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}
      </div>

      {/* Current Tour Guides List */}
      <div className="rounded-2xl border border-emerald-100 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-emerald-50 px-5 py-3.5 bg-[#f4fbf8]">
          <h3 className="text-sm font-bold text-slate-700">Current Tour Guides</h3>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="animate-spin text-teal-700" />
          </div>
        ) : guides.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <UserCheck size={22} />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-700">No tour guides yet</p>
            <p className="mt-1 text-xs text-slate-500">Add a user above by their email address.</p>
          </div>
        ) : (
          <ul className="divide-y divide-emerald-50">
            {guides.map((guide) => (
              <li key={guide.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  {guide.profileImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={guide.profileImage}
                      alt={guide.name}
                      className="h-9 w-9 rounded-full object-cover border border-emerald-100 shrink-0"
                    />
                  ) : (
                    <div className="h-9 w-9 shrink-0 rounded-full bg-teal-100 flex items-center justify-center text-teal-800 font-bold text-sm">
                      {guide.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{guide.name}</p>
                    <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                      <Mail size={11} className="shrink-0" />
                      {guide.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="hidden sm:flex items-center gap-1 text-xs text-slate-500">
                    <CalendarDays size={12} />
                    {new Date(guide.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <span className="rounded-full bg-teal-50 border border-teal-100 px-2.5 py-0.5 text-[11px] font-bold text-teal-700">
                    Tour Guide
                  </span>
                  <button
                    type="button"
                    disabled={removingEmail === guide.email}
                    onClick={() => void handleRemove(guide)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {removingEmail === guide.email ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <UserMinus size={13} />
                    )}
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
