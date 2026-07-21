import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "@/db/models";
import { DbConnect } from "@/db/connection";
import { toAuthUser, type UserDoc } from "@/lib/auth-user";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim();
    const password = String(body.password ?? "");

    const envEmail = (process.env.ADMIN_EMAIL || "admin@explorebd.com").trim();
    const envPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (
      !email ||
      !password ||
      email.toLowerCase() !== envEmail.toLowerCase() ||
      password !== envPassword
    ) {
      return NextResponse.json(
        { message: "Invalid admin credentials" },
        { status: 401 }
      );
    }

    await DbConnect();

    let user = await User.findOne({ email: envEmail });
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(envPassword, salt);
      user = await User.create({
        name: "Administrator",
        email: envEmail,
        password: passwordHash,
        role: "admin",
      });
    }

    const token = jwt.sign(
      { id: String(user._id), username: user.name, role: "admin" },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" }
    );

    const authUser = toAuthUser(user as unknown as UserDoc);

    const response = NextResponse.json(
      { message: "Admin authenticated successfully", user: authUser, token },
      { status: 200 }
    );

    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 72,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
