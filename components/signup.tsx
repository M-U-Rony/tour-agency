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
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-zinc-200/50 border border-zinc-100 p-8">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 group cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-[#e8590c] to-[#f76707] flex items-center justify-center shadow-lg shadow-orange-200 group-hover:shadow-orange-300 transition-shadow">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-zinc-900">
              Rent<span className="text-[#e8590c]">aCar</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-zinc-900">Create an account</h2>
          <p className="text-zinc-500 text-sm mt-2">Join us to start renting or listing cars</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">


          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">Username</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#e8590c]/20 focus:border-[#e8590c] transition-all"
              placeholder="Choose a username"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">Email</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#e8590c]/20 focus:border-[#e8590c] transition-all"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#e8590c]/20 focus:border-[#e8590c] transition-all"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-3 bg-linear-to-r from-[#e8590c] to-[#f76707] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-orange-200 hover:-translate-y-0.5 transition-all active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 disabled:shadow-none mt-2"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/signin" className="font-semibold text-[#e8590c] hover:text-[#f76707]">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
