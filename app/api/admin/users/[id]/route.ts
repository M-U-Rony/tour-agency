import { NextResponse } from "next/server";
import { DbConnect } from "@/db/connection";
import { User } from "@/db/models";
import bcrypt from "bcryptjs";
import { getAuthFromCookies } from "@/lib/auth-api";
import { adminUpdateUserSchema } from "@/utils/zod/types";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: userId } = await ctx.params;
    if (!userId) return NextResponse.json({ message: "Invalid user id" }, { status: 400 });

    const body = await req.json();
    const parsed = adminUpdateUserSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ message: "Invalid data" }, { status: 400 });

    await DbConnect();
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    const { name, email, password, role, profileImage, profilePage } = parsed.data;

    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) return NextResponse.json({ message: "Email already in use" }, { status: 409 });
      user.email = email;
    }
    if (name) user.name = name;
    if (role) user.role = role;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    // Admins can also upload/assign a profile image and profile PDF.
    if (typeof profileImage === "string") user.profileImage = profileImage;
    if (typeof profilePage === "string") user.profilePage = profilePage;

    await user.save();
    const saved = await User.findById(userId).select("-password").lean();
    return NextResponse.json({ user: saved });
  } catch (err) {
    console.error("Admin update user error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
