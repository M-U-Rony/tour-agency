import { NextResponse } from "next/server";
import { DbConnect } from "@/db/connection";
import { TourPackage, Booking, TripAnnouncement } from "@/db/models";
import { getAuthFromCookies } from "@/lib/auth-api";

export async function POST(req: Request) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth || auth.role !== "tour_guide") {
      return NextResponse.json({ message: "Forbidden. Tour guide access required." }, { status: 403 });
    }

    const body = (await req.json()) as {
      packageId?: string | number;
      title?: string;
      message?: string;
    };

    const packageId = body.packageId;
    const title = body.title?.trim();
    const message = body.message?.trim();

    if (!packageId || !title || !message) {
      return NextResponse.json(
        { message: "Package ID, title, and message are required." },
        { status: 400 }
      );
    }

    await DbConnect();

    const pkg = await TourPackage.findById(packageId);
    if (!pkg) {
      return NextResponse.json({ message: "Package not found" }, { status: 404 });
    }

    if (String(pkg.tourGuideId) !== String(auth.userId)) {
      return NextResponse.json(
        { message: "You are not the assigned tour guide for this package." },
        { status: 403 }
      );
    }

    const announcement = await TripAnnouncement.create({
      packageId,
      guideId: auth.userId,
      title,
      message,
    });

    const bookings = await Booking.findByPackageIds([Number(packageId)]);
    const activeBookings = bookings.filter((b) => b.status !== "cancelled");
    const notifiedCount = new Set(activeBookings.map((b) => b.userId)).size;

    return NextResponse.json({
      announcement: {
        id: String(announcement.id),
        packageId: String(announcement.packageId),
        title: announcement.title,
        message: announcement.message,
        createdAt: announcement.createdAt.toISOString(),
        guideName: announcement.guideName,
      },
      notifiedCount,
    });
  } catch (error) {
    console.error("POST /api/guide/broadcast:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const packageId = url.searchParams.get("packageId");
    if (!packageId) {
      return NextResponse.json({ announcements: [] });
    }

    await DbConnect();
    const rows = await TripAnnouncement.findByPackageId(packageId);
    const announcements = rows.map((a) => ({
      id: String(a.id),
      packageId: String(a.packageId),
      title: a.title,
      message: a.message,
      createdAt: a.createdAt.toISOString(),
      guideName: a.guideName,
    }));

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error("GET /api/guide/broadcast:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
