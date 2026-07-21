import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { User } from "@/db/models";
import { DbConnect } from "@/db/connection";
import { createUserSchema } from "@/utils/zod/types";
import { toAuthUser, type UserDoc } from "@/lib/auth-user";

export async function POST(req: Request) {
  try {
    await DbConnect();

    const result = createUserSchema.safeParse(await req.json());

    if (!result.success) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const { name, email, password } = result.data;

    if (!name || !email || !password) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 409 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      password: passwordHash,
    });

    const response = NextResponse.json(
      { message: "User created successfully", user: toAuthUser(newUser as unknown as UserDoc) },
      { status: 201 }
    );

    return response;
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
