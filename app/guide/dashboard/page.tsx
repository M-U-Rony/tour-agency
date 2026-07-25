"use client";

import AccountPage from "@/components/account-page";
import GuideDashboardView from "@/components/guide/GuideDashboardView";

export default function GuideDashboardPage() {
  return (
    <AccountPage title="My Assigned Tours" requireRole="tour_guide" redirectTo="/dashboard">
      <GuideDashboardView />
    </AccountPage>
  );
}
