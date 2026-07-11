import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "@/db/models";
import { DbConnect } from "@/db/connection";
import { toAuthUser, type UserDoc } from "@/lib/auth-user";
import { updateUserSchema } from "@/utils/zod/types";

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

export async function PUT(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let decoded: jwt.JwtPayload & { id?: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload & { id?: string };
    } catch {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = decoded.id != null ? String(decoded.id) : "";
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid data" }, { status: 400 });
    }

    const { name, email, password, profileImage, profilePage } = parsed.data;

    await DbConnect();
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) {
        return NextResponse.json({ message: "Email already in use" }, { status: 409 });
      }
      user.email = email;
    }

    if (name) user.name = name;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    if (typeof profileImage === "string") user.profileImage = profileImage;
    if (typeof profilePage === "string") user.profilePage = profilePage;

    await user.save();

    const saved = await User.findById(userId).select("-password").lean();
    // Mongoose lean() returns a plain object; we type-narrow it for our auth mapping.
    return NextResponse.json({ user: toAuthUser(saved as unknown as UserDoc) });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
