"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/auth-provider";
import { ShieldAlert, ShieldCheck, Lock } from "lucide-react";

export default function AdminSignIn({ next = null }: { next?: string | null }) {
  const router = useRouter();
  const { user, isLoading, setUser } = useAuthContext();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const nextHref = next && next.startsWith("/admin") ? next : "/admin/dashboard";

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === "admin") {
        router.replace(nextHref);
      }
    }
  }, [user, isLoading, router, nextHref]);

  if (isLoading || (user && user.role === "admin")) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Invalid admin credentials");
      }

      if (!data.user) {
        throw new Error("Invalid response from server");
      }

      if (data.user.role !== "admin") {
        throw new Error("Access Denied: This account does not have administrator privileges.");
      }

      setUser(data.user);
      router.push(nextHref);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in as admin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-slate-950 text-slate-100">
      {/* Ambient Dark Glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_center,rgba(15,118,110,0.18),transparent_50%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.08),transparent_40%)]" />

      {/* Top Header */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-sm font-extrabold text-white shadow-lg shadow-teal-500/20">
            EB
          </span>
          <span className="text-base font-extrabold tracking-tight text-white">
            ExploreBD
          </span>
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-300">
          <ShieldCheck size={14} /> Admin Portal
        </span>
      </header>

      {/* Auth Card Container */}
      <main className="z-10 flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md rounded-[2.5rem] border border-slate-800/80 bg-slate-900/90 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-500/30 bg-teal-950/60 text-teal-400 shadow-inner">
              <Lock size={26} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-[Georgia,Times_New_Roman,serif]">
              Admin Sign In
            </h1>
            <p className="mt-2 text-xs text-slate-400">
              Access the ExploreBD administration dashboard to manage packages, bookings, and users.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-xs font-medium text-red-300">
              <ShieldAlert size={16} className="shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Admin Email
              </label>
              <input
                type="email"
                required
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition duration-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                placeholder="admin@explorebdtours.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Password
              </label>
              <input
                type="password"
                required
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition duration-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-3 w-full rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 py-3.5 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(15,118,110,0.3)] transition hover:-translate-y-0.5 hover:from-teal-500 hover:to-emerald-500 active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer"
            >
              {loading ? "Authenticating Admin..." : "Sign In to Admin Portal"}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-500">
            Standard traveler account?{" "}
            <Link
              href="/signin"
              className="font-semibold text-teal-400 hover:text-teal-300 transition-colors underline decoration-teal-400/30 underline-offset-4"
            >
              Go to Traveler Sign In
            </Link>
          </p>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="py-6 text-center text-xs text-slate-600">
        &copy; {new Date().getFullYear()} ExploreBD Admin Security System
      </footer>
    </div>
  );
}
