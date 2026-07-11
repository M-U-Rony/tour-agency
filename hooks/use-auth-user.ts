"use client";

import { useAuthContext } from "@/components/auth-provider";

export function useAuthUser() {
  return useAuthContext();
}
