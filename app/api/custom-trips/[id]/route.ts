import { NextResponse } from "next/server";
import { DbConnect } from "@/db/connection";
import { CustomTripRequest } from "@/db/models";
import { getAuthFromCookies } from "@/lib/auth-api";
import { serializeCustomTripRequest } from "@/lib/custom-trip";
import { updateCustomTripRequestSchema } from "@/utils/zod/types";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = updateCustomTripRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await DbConnect();
    const doc = await CustomTripRequest.findByIdAndUpdate(id, parsed.data);
    if (!doc) {
      return NextResponse.json({ message: "Request not found" }, { status: 404 });
    }

    return NextResponse.json({ request: serializeCustomTripRequest(doc) });
  } catch (error) {
    console.error("PATCH custom-trip:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
