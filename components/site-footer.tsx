"use client";

import Link from "next/link";
import { useInsideSidebar } from "@/components/sidebar-context";
import { MapPin, Phone, Mail } from "lucide-react";

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

export default function SiteFooter() {
  const isInsideSidebar = useInsideSidebar();
  if (isInsideSidebar) return null;

  return (
    <footer className="relative border-t border-teal-950/20 bg-slate-900 text-slate-300 overflow-hidden">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/2 h-96 w-96 rounded-full bg-teal-500/5 blur-[120px]" />
        <div className="absolute -right-1/4 -bottom-1/2 h-96 w-96 rounded-full bg-emerald-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-16 pb-8 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4 lg:gap-12 mb-12">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-sm font-extrabold text-white shadow-md shadow-teal-500/10">
                EB
              </span>
              <span className="text-base font-extrabold tracking-tight text-white">
                ExploreBD
              </span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Premium travel curator for authentic journeys across Bangladesh. Discover coastal escapes, hill tracks, and cultural heritage circuits.
            </p>
            <div className="flex items-center gap-3 pt-2">
              {socials.map(({ label, href, icon }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-800/40 text-slate-400 hover:text-teal-400 hover:border-teal-500/50 hover:bg-slate-800 transition-all duration-300"
                >
                  {icon}
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/tours" className="hover:text-teal-400 transition-colors duration-200">
                  Explore Tours
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-teal-400 transition-colors duration-200">
                  Custom Request
                </Link>
              </li>
              <li>
                <Link href="/signin" className="hover:text-teal-400 transition-colors duration-200">
                  Account Login
                </Link>
              </li>
              <li>
                <Link href="/admin/signin" className="hover:text-teal-400 transition-colors duration-200">
                  Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details Column */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Contact Us
            </h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin size={16} className="text-teal-500 shrink-0 mt-0.5" />
                <span>Gulshan Avenue, Dhaka 1212</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={16} className="text-teal-500 shrink-0" />
                <span>+880 1700-123456</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={16} className="text-teal-500 shrink-0" />
                <span>hello@explorebdtours.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright area */}
        <div className="border-t border-slate-800/60 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} ExploreBD. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
