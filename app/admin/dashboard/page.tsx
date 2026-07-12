"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminDashboard from "@/components/admin-dashboard";
import LoadingSpinner from "@/components/loading-spinner";
import { useAuthUser } from "@/hooks/use-auth-user";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthUser();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/signin");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!isLoading && user && user.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== "admin") {
    return <LoadingSpinner fullScreen />;
  }

  return <AdminDashboard user={user} />;
}
