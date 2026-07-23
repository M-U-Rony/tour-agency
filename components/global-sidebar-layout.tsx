"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useAuthUser } from "@/hooks/use-auth-user";
import AccountShell from "@/components/account-shell";
import { InsideSidebarProvider } from "@/components/sidebar-context";

export default function GlobalSidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuthUser();
  const pathname = usePathname();

  // Check if current route is an account/dashboard page that already renders the sidebar locally
  const isAuthRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/custom-trips") ||
    pathname.startsWith("/user/dashboard") ||
    pathname.startsWith("/wishlist");

  const isSignRoute = pathname === "/signin" || pathname === "/signup";

  // Wrap public pages in the sidebar only if the user is authenticated and not on signin/signup
  const shouldWrapGlobally = !!user && !isSignRoute && !isAuthRoute;

  if (shouldWrapGlobally) {
    let title = "ExploreBD";
    if (pathname === "/") title = "Home";
    else if (pathname.startsWith("/tours/")) title = "Tour Details";
    else if (pathname === "/tours") title = "Explore Tours";
    else if (pathname === "/contact") title = "Custom Trip Request";

    return (
      <AccountShell user={user} title={title}>
        <InsideSidebarProvider value={true}>
          {children}
        </InsideSidebarProvider>
      </AccountShell>
    );
  }

  const hasLocalSidebar = isAuthRoute;

  return (
    <InsideSidebarProvider value={hasLocalSidebar}>
      {children}
    </InsideSidebarProvider>
  );
}
