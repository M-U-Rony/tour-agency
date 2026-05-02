import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { User } from "@/db/models";
import { DbConnect } from "@/db/connection";
import { toAuthUser } from "@/lib/auth-user";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let decoded: jwt.JwtPayload & { id?: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload & {
        id?: string;
      };
    } catch {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = decoded.id != null ? String(decoded.id) : "";
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await DbConnect();
    const user = await User.findById(userId).select("-password").lean();
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 401 });
    }

    const doc = user as {
      _id: unknown;
      name: string;
      email: string;
      role: string;
    };
    return NextResponse.json({ user: toAuthUser(doc) });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
