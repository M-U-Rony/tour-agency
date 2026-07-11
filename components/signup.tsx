"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function SignUp({ next = null }: { next?: string | null }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to sign up");
      }

      router.push(`/signin${next ? `?next=${encodeURIComponent(next)}` : ""}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-[linear-gradient(180deg,#f4fbf8_0%,#effaf5_36%,#ffffff_100%)]">
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.1),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.08),transparent_30%)] -z-10" />

      {/* Floating Transparent Brand Header */}
      <header className="w-full max-w-6xl mx-auto px-4 py-6 sm:px-6 flex items-center justify-between z-10">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-700 text-base font-bold text-white">
            EB
          </span>
          <div>
            <p className="text-lg font-semibold tracking-wide text-slate-900">ExploreBD Tours</p>
            <p className="text-xs text-slate-500">Premium travel across Bangladesh</p>
          </div>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-white/85 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:bg-[#f4fbf8] hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>
      </header>

      {/* Auth Card Container */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 z-10">
        <div className="w-full max-w-md rounded-[2.5rem] border border-white bg-white/85 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl text-slate-900">
          <div className="mb-7">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 font-[Georgia,Times_New_Roman,serif]">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Sign up to request bookings and track your trips.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Name
              </label>
              <input
                type="text"
                required
                className="w-full rounded-2xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-[box-shadow,border-color,background-color] focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                placeholder="Your name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Email
              </label>
              <input
                type="email"
                required
                className="w-full rounded-2xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-[box-shadow,border-color,background-color] focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Password
              </label>
              <input
                type="password"
                required
                className="w-full rounded-2xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-[box-shadow,border-color,background-color] focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full rounded-2xl bg-teal-700 py-3.5 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(15,118,110,0.15)] transition hover:-translate-y-0.5 hover:bg-teal-800 active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              href={`/signin${next ? `?next=${encodeURIComponent(next)}` : ""}`}
              className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors underline decoration-emerald-600/30 underline-offset-4"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-slate-400 z-10">
        &copy; {new Date().getFullYear()} ExploreBD Tours. All rights reserved.
      </footer>
    </div>
  );
}
