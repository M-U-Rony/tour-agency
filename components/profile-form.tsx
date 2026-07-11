"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle, Mail, User } from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { getUserAvatarUrl } from "@/lib/user-avatar";

const inputClass =
  "w-full rounded-2xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10";

const labelClass =
  "mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500";

export default function ProfileForm() {
  const { user, isLoading, refetch, setUser } = useAuthUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.username);
      setEmail(user.email);
      setProfileImage(user.profileImage?.trim() || null);
    }
  }, [user]);

  async function handleImageChange(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/upload/profile", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: data?.message ?? "Upload failed" });
        return;
      }
      setProfileImage(data.url);
      if (user) {
        setUser({ ...user, profileImage: data.url });
      }
      setMessage({ type: "ok", text: "Photo updated — save to apply other changes." });
    } catch {
      setMessage({ type: "err", text: "Could not upload photo." });
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const body: { name: string; email: string; profileImage?: string } = { name, email };
      if (profileImage) body.profileImage = profileImage;

      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: data?.message ?? "Update failed" });
        return;
      }

      const updated = data.user;
      if (updated) {
        setUser(updated);
      } else {
        void refetch();
      }
      setMessage({ type: "ok", text: "Profile saved successfully." });
    } catch {
      setMessage({ type: "err", text: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-t-transparent" />
      </div>
    );
  }

  const displayAvatar = user
    ? getUserAvatarUrl(
        { profileImage: profileImage ?? user.profileImage, email: user.email },
        200
      )
    : null;

  const roleLabel = user?.role === "admin" ? "Administrator" : "Explorer";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-[2rem] border border-white bg-white/90 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl overflow-hidden">
        <div className="h-28 bg-linear-to-r from-teal-700 via-teal-600 to-emerald-600" />
        <div className="px-6 pb-6 sm:px-8">
          <div className="-mt-14 flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
            <div className="relative shrink-0">
              {displayAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayAvatar}
                  alt=""
                  className="h-28 w-28 rounded-2xl object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="h-28 w-28 rounded-2xl border-4 border-white bg-slate-100 flex items-center justify-center text-slate-400 shadow-lg">
                  <User className="h-10 w-10" />
                </div>
              )}
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-white shadow-md hover:bg-teal-800 disabled:opacity-60"
                aria-label="Change photo"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleImageChange(f);
                  e.target.value = "";
                }}
              />
            </div>
            <div className="pb-1 min-w-0 flex-1">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 truncate">
                {name || user?.username || "Your profile"}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">{roleLabel}</p>
              <p className="text-sm text-slate-600 mt-1 truncate">{email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white bg-white/90 p-6 sm:p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Account details</h3>
          <p className="mt-1 text-sm text-slate-500">
            Update how your name and email appear across ExploreBD.
          </p>
        </div>

        <div>
          <label className={labelClass}>
            <User className="h-3.5 w-3.5" /> Full name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            required
            placeholder="Your name"
          />
        </div>

        <div>
          <label className={labelClass}>
            <Mail className="h-3.5 w-3.5" /> Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            required
            placeholder="you@example.com"
          />
        </div>

        {message ? (
          <div
            className={`flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm ${
              message.type === "ok"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message.type === "ok" ? (
              <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
            ) : null}
            <span>{message.text}</span>
          </div>
        ) : null}

        <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || uploading}
            className="inline-flex justify-center items-center rounded-2xl bg-teal-700 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          {uploading ? (
            <span className="text-sm text-slate-500">Uploading photo…</span>
          ) : null}
        </div>
      </div>
    </form>
  );
}
