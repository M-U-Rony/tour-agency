"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignUp() {
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

      router.push("/signin");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ecf7ff_0%,#f7fbfd_32%,#ffffff_100%)] flex items-center justify-center p-6 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/70 p-8">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 mb-4 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-900 flex items-center justify-center shadow-lg shadow-sky-200 group-hover:shadow-sky-300 transition-shadow">
              <span className="text-white font-bold text-sm">EB</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Explore<span className="text-sky-700">BD</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-slate-900">
            Create an account
          </h2>
          <p className="text-slate-500 text-sm mt-2">
            Join us to start exploring Bangladesh
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Username
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
              placeholder="Choose a username"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
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
            className="w-full flex items-center justify-center py-3 bg-sky-900 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-sky-200 hover:-translate-y-0.5 transition-all active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 disabled:shadow-none mt-2"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            href="/signin"
            className="font-semibold text-sky-700 hover:text-sky-800"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
