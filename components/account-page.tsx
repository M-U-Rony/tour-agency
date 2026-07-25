"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AccountShell from "@/components/account-shell";
import LoadingSpinner from "@/components/loading-spinner";
import { useAuthUser } from "@/hooks/use-auth-user";

type AccountPageProps = {
  title: string;
  requireRole?: "admin" | "user" | "tour_guide";
  redirectTo?: string;
  actions?: React.ReactNode;
  wide?: boolean;
  children: React.ReactNode;
};

export default function AccountPage({
  title,
  requireRole,
  redirectTo,
  actions,
  wide,
  children,
}: AccountPageProps) {
  const router = useRouter();
  const { user, isLoading } = useAuthUser();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push("/signin");
      return;
    }
    if (requireRole === "admin" && user.role !== "admin") {
      router.replace(redirectTo ?? "/dashboard");
      return;
    }
    if (requireRole === "tour_guide" && user.role !== "tour_guide") {
      router.replace(redirectTo ?? "/dashboard");
      return;
    }
    if (requireRole === "user" && user.role === "admin") {
      router.replace(redirectTo ?? "/admin/dashboard");
    }
  }, [isLoading, user, router, requireRole, redirectTo]);

  if (isLoading || !user) {
    return <LoadingSpinner fullScreen />;
  }

  if (requireRole === "admin" && user.role !== "admin") {
    return <LoadingSpinner fullScreen />;
  }

  if (requireRole === "tour_guide" && user.role !== "tour_guide") {
    return <LoadingSpinner fullScreen />;
  }

  if (requireRole === "user" && user.role === "admin") {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <AccountShell user={user} title={title} actions={actions} wide={wide}>
      {children}
    </AccountShell>
  );
}
