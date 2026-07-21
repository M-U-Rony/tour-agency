import { NextResponse } from "next/server";
import { DbConnect } from "@/db/connection";
import { TourPackage } from "@/db/models";
import { updateTourPackageSchema } from "@/utils/zod/types";
import { getAuthFromCookies } from "@/lib/auth-api";
import { serializeTourPackage } from "@/lib/tour-package";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    await DbConnect();
    const doc = await TourPackage.findById(id);
    if (!doc) {
      return NextResponse.json({ message: "Package not found" }, { status: 404 });
    }
    return NextResponse.json({ package: serializeTourPackage(doc) });
  } catch (error) {
    console.error("GET package:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

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
    const parsed = updateTourPackageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await DbConnect();
    const update = {
      ...parsed.data,
      ...(parsed.data.availableDates
        ? {
            availableDates: parsed.data.availableDates
              .map((d) => new Date(d))
              .filter((d) => !Number.isNaN(d.getTime())),
          }
        : {}),
    };
    const doc = await TourPackage.findByIdAndUpdate(id, update);
    if (!doc) {
      return NextResponse.json({ message: "Package not found" }, { status: 404 });
    }
    return NextResponse.json({ package: serializeTourPackage(doc) });
  } catch (error) {
    console.error("PATCH package:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const { id } = await ctx.params;
    await DbConnect();
    const removed = await TourPackage.findByIdAndDelete(id);
    if (!removed) {
      return NextResponse.json({ message: "Package not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("DELETE package:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
