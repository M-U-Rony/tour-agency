"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminDashboard from "@/components/admin-dashboard";
import UserDashboard from "@/components/user-dashboard";
import LoadingSpinner from "@/components/loading-spinner";
import { useAuthUser } from "@/hooks/use-auth-user";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthUser();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/signin");
      return;
    }
    if (!isLoading && user?.role === "tour_guide") {
      router.push("/guide/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role === "tour_guide") {
    return <LoadingSpinner fullScreen />;
  }

  if (user.role === "admin") {
    return <AdminDashboard user={user} />;
  }

  return <UserDashboard user={user} />;
}
