"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import UserDashboard from "@/components/user-dashboard";
import LoadingSpinner from "@/components/loading-spinner";
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

  if (isLoading || !user || user.role === "admin") {
    return <LoadingSpinner fullScreen />;
  }

  return <UserDashboard user={user} />;
}
