import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export type AuthJwt = { userId: string; role: "user" | "admin" | "tour_guide" };

export async function getAuthFromCookies(): Promise<AuthJwt | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id?: unknown;
      role?: string;
    };
    const userId = decoded.id != null ? String(decoded.id) : "";
    if (!userId) return null;
    const role =
      decoded.role === "admin"
        ? "admin"
        : decoded.role === "tour_guide"
        ? "tour_guide"
        : "user";
    return { userId, role };
  } catch {
    return null;
  }
}
