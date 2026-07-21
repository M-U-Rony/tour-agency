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

    const updates: Parameters<typeof User.update>[1] = {};

    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) return NextResponse.json({ message: "Email already in use" }, { status: 409 });
      updates.email = email;
    }
    if (name) updates.name = name;
    if (role) updates.role = role;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(password, salt);
    }

    if (typeof profileImage === "string") updates.profileImage = profileImage;
    if (typeof profilePage === "string") updates.profilePage = profilePage;

    const saved = await User.update(userId, updates);
    if (!saved) return NextResponse.json({ message: "User not found" }, { status: 404 });

    const { password: _, ...userWithoutPassword } = saved;
    return NextResponse.json({ user: userWithoutPassword });
  } catch (err) {
    console.error("Admin update user error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
