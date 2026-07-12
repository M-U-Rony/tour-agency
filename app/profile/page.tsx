"use client";

import AccountPage from "@/components/account-page";
import ProfileForm from "@/components/profile-form";

export default function ProfilePage() {
  return (
    <AccountPage title="Edit profile">
      <ProfileForm />
    </AccountPage>
  );
}
