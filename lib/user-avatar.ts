import type { AuthUser } from "@/lib/auth-user";

export function getUserAvatarUrl(
  user: Pick<AuthUser, "profileImage" | "email">,
  size = 150
): string {
  const saved = user.profileImage?.trim();
  if (saved) return saved;
  return `https://i.pravatar.cc/${size}?u=${encodeURIComponent(user.email)}`;
}
