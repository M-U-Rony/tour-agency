import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "@/db/models";
import { DbConnect } from "@/db/connection"
import { loginUserSchema } from "@/utils/zod/types";

export async function POST(req: Request) {
  try {

    await DbConnect();  

    const result = loginUserSchema.safeParse(await req.json());
    if (!result.success) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const { email, password } = result.data;

    const user = await User.findOne({ email });
    console.log(user)
    
    if (!user) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }


    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }


    const token = jwt.sign(
      { id: user._id, username: user.name, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" }
    );

    const userWithoutHash = {
      id: user._id,
      username: user.name,
      email: user.email,
      role: user.role
    };

    const response = NextResponse.json(
      { message: "Logged in successfully", user: userWithoutHash, token },
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
    console.error("Signin error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
