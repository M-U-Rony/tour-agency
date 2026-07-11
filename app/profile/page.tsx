"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AccountShell from "@/components/account-shell";
import ProfileForm from "@/components/profile-form";
import { useAuthUser } from "@/hooks/use-auth-user";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading } = useAuthUser();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/signin");
    }
  }, [isLoading, router, user]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4fbf8]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-t-transparent" />
      </div>
    );
  }

  return (
    <AccountShell user={user} title="Edit profile">
      <ProfileForm />
    </AccountShell>
  );
}
