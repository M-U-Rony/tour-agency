import { NextResponse } from "next/server";
import { DbConnect } from "@/db/connection";
import { CustomTripRequest, User } from "@/db/models";
import { getAuthFromCookies } from "@/lib/auth-api";
import { serializeCustomTripRequest } from "@/lib/custom-trip";
import { customTripRequestSchema } from "@/utils/zod/types";

export async function GET() {
  try {
    const auth = await getAuthFromCookies();
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await DbConnect();
    const docs = await CustomTripRequest.find();
    return NextResponse.json({
      requests: docs.map((doc) => serializeCustomTripRequest(doc)),
    });
  } catch (error) {
    console.error("GET custom-trips:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = customTripRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await DbConnect();
    const user = await User.findById(auth.userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const created = await CustomTripRequest.create({
      ...parsed.data,
      userId: auth.userId,
      name: user.name,
      email: user.email,
      phone: parsed.data.phone || "",
      departureDate: new Date(parsed.data.departureDate),
      returnDate: new Date(parsed.data.returnDate),
    });
    return NextResponse.json(
      { request: serializeCustomTripRequest(created) },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST custom-trips:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
