import { NextResponse } from "next/server";
import { DbConnect } from "@/db/connection";
import { Wishlist, TourPackage } from "@/db/models";
import { getAuthFromCookies } from "@/lib/auth-api";
import { serializeTourPackage } from "@/lib/tour-package";

export async function GET() {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await DbConnect();
    const rows = await Wishlist.findByUserId(auth.userId);
    const packageIds = rows.map((r) => r.packageId);

    if (packageIds.length === 0) {
      return NextResponse.json({ packageIds: [], packages: [] });
    }

    const docs = await TourPackage.find({
      filter: { _id: { $in: packageIds } },
    });

    const packages = docs.map((d) => serializeTourPackage(d));
    return NextResponse.json({ packageIds, packages });
  } catch (error) {
    console.error("GET wishlist:", error);
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
    const packageId = Number(body.packageId);

    if (Number.isNaN(packageId) || packageId <= 0) {
      return NextResponse.json({ message: "Invalid package ID" }, { status: 400 });
    }

    await DbConnect();
    const result = await Wishlist.toggle(auth.userId, packageId);
    return NextResponse.json({ wishlisted: result.wishlisted, packageId });
  } catch (error) {
    console.error("POST wishlist:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
