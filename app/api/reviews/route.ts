import { NextResponse } from "next/server";
import { DbConnect } from "@/db/connection";
import { Booking, Review, TourPackage, User } from "@/db/models";
import { getAuthFromCookies } from "@/lib/auth-api";
import { serializeReview } from "@/lib/review";
import { createReviewSchema } from "@/utils/zod/types";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const packageId = url.searchParams.get("packageId");
    if (!packageId) {
      return NextResponse.json({ message: "packageId is required" }, { status: 400 });
    }

    await DbConnect();
    const docs = await Review.find({ packageId });
    const userIds = Array.from(new Set(docs.map((doc) => String(doc.userId))));
    const users = userIds.length
      ? await User.find({ _id: { $in: userIds } })
      : [];
    const userById = new Map(users.map((u) => [String(u._id), u]));

    return NextResponse.json({
      reviews: docs.map((doc) => serializeReview(doc, userById.get(String(doc.userId)))),
    });
  } catch (error) {
    console.error("GET reviews:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth || auth.role !== "user") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await DbConnect();
    const booking = await Booking.findById(parsed.data.bookingId);
    if (!booking || String(booking.userId) !== auth.userId) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }
    if (booking.status !== "completed") {
      return NextResponse.json(
        { message: "Only completed trips can be reviewed" },
        { status: 400 }
      );
    }

    const created = await Review.create({
      userId: auth.userId,
      packageId: booking.packageId,
      bookingId: booking._id,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    });

    const avgRating = await Review.getAverageRating(booking.packageId);
    if (avgRating !== null) {
      await TourPackage.findByIdAndUpdate(booking.packageId, {
        rating: Math.round(avgRating * 10) / 10,
      });
    }

    return NextResponse.json(
      { review: serializeReview(created) },
      { status: 201 }
    );
  } catch (error: any) {
    if (
      (typeof error === "object" && error !== null) &&
      (error.code === "ER_DUP_ENTRY" || error.errno === 1062 || error.code === 11000 || String(error.message).includes("Duplicate entry"))
    ) {
      return NextResponse.json(
        { message: "This booking has already been reviewed" },
        { status: 409 }
      );
    }
    console.error("POST reviews:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
