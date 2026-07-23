"use client";

import AccountPage from "@/components/account-page";
import WishlistView from "@/components/wishlist-view";

export default function WishlistPage() {
  return (
    <AccountPage title="My Wishlist" requireRole="user" redirectTo="/admin/dashboard">
      <WishlistView />
    </AccountPage>
  );
}
