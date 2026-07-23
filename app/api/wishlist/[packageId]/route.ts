import { NextResponse } from "next/server";
import { DbConnect } from "@/db/connection";
import { Wishlist } from "@/db/models";
import { getAuthFromCookies } from "@/lib/auth-api";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ packageId: string }> }
) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { packageId } = await ctx.params;
    const numPkgId = Number(packageId);
    if (Number.isNaN(numPkgId) || numPkgId <= 0) {
      return NextResponse.json({ message: "Invalid package ID" }, { status: 400 });
    }

    await DbConnect();
    await Wishlist.remove(auth.userId, numPkgId);
    return NextResponse.json({ message: "Removed from wishlist" });
  } catch (error) {
    console.error("DELETE wishlist item:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
