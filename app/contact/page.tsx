import type { Metadata } from "next";
import Link from "next/link";
import { getAuthFromCookies } from "@/lib/auth-api";
import CustomTripForm from "@/components/custom-trip-form";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Contact & Custom Trip Request – ExploreBD Tours",
  description:
    "Can't find your dream destination in our packages? Submit a custom trip request and our team will plan a personalised tour just for you.",
};

const contactDetails = [
  {
    icon: MapPin,
    label: "Office",
    value: "Gulshan Avenue, Dhaka 1212",
  },
  {
    icon: Phone,
    label: "Phone / WhatsApp",
    value: "+880 1700-123456",
  },
  {
    icon: Mail,
    label: "Email",
    value: "hello@explorebdtours.com",
  },
  {
    icon: Clock,
    label: "Working hours",
    value: "Sat – Thu, 9 AM – 8 PM",
  },
];

const socials = [
  {
    label: "Facebook",
    href: "#",
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "#",
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.01 3.71.054 1.14.051 1.96.233 2.508.448A4.974 4.974 0 0120.3 4.3a4.8 4.8 0 011.8 1.9c.216.54.398 1.36.448 2.508.04 1.01.059 1.32.059 4.07 0 2.75-.02 3.06-.059 4.07-.05 1.14-.232 1.96-.448 2.508a4.8 4.8 0 01-1.8 1.9 4.974 4.974 0 01-1.9 1.8c-.547.215-1.36.398-2.508.448-1.01.04-1.32.059-4.07.059-2.75 0-3.06-.02-4.07-.059-1.14-.05-1.96-.233-2.508-.448a4.8 4.8 0 01-1.9-1.8 4.8 4.8 0 01-1.8-1.9c-.215-.54-.398-1.36-.448-2.508C2.012 15.6 2 15.29 2 12.54c0-2.75.02-3.06.059-4.07.05-1.14.233-1.96.448-2.508A4.8 4.8 0 014.3 4.3a4.8 4.8 0 011.9-1.8c.54-.215 1.36-.398 2.508-.448C9.762 2.012 10.07 2 12.825 2h-.51zM12 7.875a4.125 4.125 0 100 8.25 4.125 4.125 0 000-8.25zM12 14.625a2.625 2.625 0 110-5.25 2.625 2.625 0 010 5.25zM18.437 6.75a.75.75 0 10-1.5 0 .75.75 0 001.5 0z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "#",
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C22 8.68 22 12 22 12s0 3.32-.42 4.814a2.44 2.44 0 01-1.768 1.768C18.32 19 12 19 12 19s-6.32 0-7.814-.42a2.44 2.44 0 01-1.768-1.768C2 15.32 2 12 2 12s0-3.32.42-4.814a2.44 2.44 0 011.768-1.768C5.68 5 12 5 12 5s6.32 0 7.812.418zM9.75 15.002L15.5 12 9.75 9v6.002z" clipRule="evenodd" />
      </svg>
    ),
  },
];

export default async function ContactPage() {
  const auth = await getAuthFromCookies();

  return (
    <div className="relative min-h-screen flex flex-col bg-[linear-gradient(180deg,#f4fbf8_0%,#effaf5_36%,#ffffff_100%)] overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.09),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.07),transparent_30%)] pointer-events-none" />

      {/* ── Header ────────────────────────────────────── */}
      <header className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-10 flex items-center justify-between z-10">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-700 text-base font-bold text-white">
            EB
          </span>
          <div>
            <p className="text-lg font-semibold tracking-wide text-slate-900">ExploreBD Tours</p>
            <p className="text-xs text-slate-500">Premium travel across Bangladesh</p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/tours"
            className="hidden sm:inline-flex rounded-full border border-emerald-100 bg-white/85 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:bg-[#f4fbf8]"
          >
            Browse tours
          </Link>
          {auth ? (
            <Link
              href={auth.role === "admin" ? "/admin/dashboard" : "/dashboard"}
              className="rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
            >
              My dashboard
            </Link>
          ) : (
            <Link
              href="/signin"
              className="rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>

      {/* ── Hero strip ────────────────────────────────── */}
      <div className="w-full max-w-7xl mx-auto px-4 pb-6 pt-2 sm:px-6 lg:px-10 z-10">
        <span className="inline-flex rounded-full border border-teal-200 bg-teal-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
          Custom Trip Enquiry
        </span>
        <h1 className="mt-4 max-w-2xl font-[Georgia,Times_New_Roman,serif] text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
          Can&apos;t find your destination?<br />We&apos;ll plan it for you.
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-8 text-slate-600">
          Our packages cover popular spots, but Bangladesh has far more to explore.
          Fill in the form and our team will craft a personalised itinerary around your
          exact dates, group size, and budget.
        </p>
      </div>

      {/* ── Main content ──────────────────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 pb-20 sm:px-6 lg:px-10 z-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-14">

          {/* ── Left sidebar ──────────────────────────── */}
          <aside className="space-y-8">
            {/* Contact info card */}
            <div className="rounded-[2rem] border border-white bg-white/85 p-7 shadow-[0_20px_60px_rgba(15,23,42,0.07)] backdrop-blur-xl">
              <h2 className="text-lg font-semibold text-slate-900">Get in touch</h2>
              <p className="mt-1 text-sm text-slate-500">
                Prefer to talk? Reach us directly.
              </p>
              <ul className="mt-6 space-y-5">
                {contactDetails.map(({ icon: Icon, label, value }) => (
                  <li key={label} className="flex items-start gap-3.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                        {label}
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-slate-800">{value}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-7 flex items-center gap-3 border-t border-slate-100 pt-6">
                {socials.map(({ label, href, icon }) => (
                  <Link
                    key={label}
                    href={href}
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-100 bg-white text-slate-500 transition hover:border-teal-300 hover:text-teal-700"
                  >
                    {icon}
                  </Link>
                ))}
              </div>
            </div>

            {/* Why choose us blurb */}
            <div className="rounded-[2rem] border border-emerald-100 bg-emerald-50/60 p-7 shadow-[0_20px_60px_rgba(16,185,129,0.07)]">
              <h2 className="text-base font-semibold text-slate-900">Why request a custom trip?</h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {[
                  "Access any destination in Bangladesh",
                  "Itinerary built around your group size",
                  "Your dates, your budget, your pace",
                  "Dedicated guide & support throughout",
                  "Response within 24 hours",
                ].map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <svg viewBox="0 0 20 20" fill="none" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true">
                      <circle cx="10" cy="10" r="10" className="fill-emerald-500/15" />
                      <path d="M6 10.2 8.5 12.7 14 7.3" className="stroke-emerald-600" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* ── Form ──────────────────────────────────── */}
          <div>
            <CustomTripForm />
          </div>
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────── */}
      <footer className="w-full py-6 text-center text-xs text-slate-400 z-10">
        &copy; {new Date().getFullYear()} ExploreBD Tours. All rights reserved.
      </footer>
    </div>
  );
}
