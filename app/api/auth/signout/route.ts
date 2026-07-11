import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const redirectTo = url.searchParams.get("next") || "/";
  const res = NextResponse.redirect(new URL(redirectTo, req.url), {
    status: 303,
  });
  res.cookies.set({
    name: "token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
  return res;
}
