import { NextResponse } from "next/server";
import { DbConnect, pool } from "@/db/connection";
import { User } from "@/db/models";
import { getAuthFromCookies } from "@/lib/auth-api";

async function requireAdmin() {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return null;
  return auth;
}

async function ensureTourGuideEnum() {
  try {
    await pool.query(
      "ALTER TABLE users MODIFY COLUMN role ENUM('user', 'admin', 'tour_guide') NOT NULL DEFAULT 'user'"
    );
  } catch {}
}

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    await DbConnect();
    await ensureTourGuideEnum();
    const guides = await User.findByRole("tour_guide");
    return NextResponse.json({ guides });
  } catch (err) {
    console.error("GET /api/admin/tour-guides:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    await DbConnect();
    await ensureTourGuideEnum();

    const body = (await req.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase();
    if (!email) return NextResponse.json({ message: "Email is required" }, { status: 400 });

    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ message: "No user found with that email" }, { status: 404 });
    if (user.role === "admin") return NextResponse.json({ message: "Cannot change role of an admin" }, { status: 400 });
    if (user.role === "tour_guide") return NextResponse.json({ message: "User is already a tour guide" }, { status: 400 });

    await User.update(user.id, { role: "tour_guide" });
    const updated = await User.findById(user.id);
    return NextResponse.json({ guide: updated }, { status: 200 });
  } catch (err) {
    console.error("POST /api/admin/tour-guides:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    await DbConnect();

    const body = (await req.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase();
    if (!email) return NextResponse.json({ message: "Email is required" }, { status: 400 });

    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ message: "No user found with that email" }, { status: 404 });
    if (user.role !== "tour_guide") return NextResponse.json({ message: "User is not a tour guide" }, { status: 400 });

    await User.update(user.id, { role: "user" });
    return NextResponse.json({ message: "Tour guide role removed" });
  } catch (err) {
    console.error("DELETE /api/admin/tour-guides:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
