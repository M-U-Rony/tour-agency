import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED_PREFIXES = ["/dashboard", "/user", "/admin", "/profile", "/custom-trips"];
const PUBLIC_ADMIN_ROUTES = ["/admin/login", "/admin/signin"];
const ADMIN_PREFIXES = ["/admin"];

function pathMatches(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

let secretKey: Uint8Array | null = null;
function getSecret(): Uint8Array | null {
  if (secretKey) return secretKey;
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  secretKey = new TextEncoder().encode(secret);
  return secretKey;
}

async function verifyToken(token: string | undefined) {
  if (!token) return null;
  const secret = getSecret();
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    const id = payload.id;
    const role = payload.role;
    if (typeof id !== "string" && typeof id !== "number") return null;
    return {
      userId: String(id),
      role: role === "admin" ? "admin" : "user",
    } as const;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Allow public admin auth pages without protection
  if (PUBLIC_ADMIN_ROUTES.includes(pathname)) {
    const token = req.cookies.get("token")?.value;
    const auth = await verifyToken(token);
    if (auth?.role === "admin") {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (!pathMatches(pathname, PROTECTED_PREFIXES)) {
    return NextResponse.next();
  }

  const token = req.cookies.get("token")?.value;
  const auth = await verifyToken(token);

  if (!auth) {
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    url.search = `?next=${encodeURIComponent(pathname + (search || ""))}`;
    return NextResponse.redirect(url);
  }

  if (pathMatches(pathname, ADMIN_PREFIXES) && auth.role !== "admin") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/user/:path*",
    "/admin/:path*",
    "/profile/:path*",
    "/custom-trips/:path*",
  ],
};
