import { NextResponse } from "next/server";
import { DbConnect } from "@/db/connection";
import { CustomTripRequest, User } from "@/db/models";
import { getAuthFromCookies } from "@/lib/auth-api";
import { serializeCustomTripRequest } from "@/lib/custom-trip";

export async function GET() {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await DbConnect();

    const me = await User.findById(auth.userId).select("email").lean();
    const email = (me as { email?: string } | null)?.email;
    if (!email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const docs = await CustomTripRequest.find({ email })
      .sort({ createdAt: -1 })
      .lean();

    type LeanCustomTrip = Parameters<typeof serializeCustomTripRequest>[0];
    return NextResponse.json({
      requests: docs.map((doc) => serializeCustomTripRequest(doc as LeanCustomTrip)),
    });
  } catch (error) {
    console.error("GET custom-trips/me:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

