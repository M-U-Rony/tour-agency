"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import UserDashboard from "@/components/user-dashboard";
import { useAuthUser } from "@/hooks/use-auth-user";

export default function UserDashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthUser();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/signin");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!isLoading && user?.role === "admin") {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4fbf8]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-700" />
      </div>
    );
  }

  if (user.role === "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4fbf8]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-700" />
      </div>
    );
  }

  return <UserDashboard user={user} />;
}
