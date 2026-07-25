"use client";

import AccountPage from "@/components/account-page";
import TourGuidesView from "@/components/admin/TourGuidesView";

export default function TourGuidesPage() {
  return (
    <AccountPage title="Tour Guides" requireRole="admin" redirectTo="/dashboard">
      <TourGuidesView />
    </AccountPage>
  );
}
