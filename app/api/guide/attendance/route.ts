import { NextResponse } from "next/server";
import { DbConnect } from "@/db/connection";
import { Booking, TourPackage } from "@/db/models";
import { getAuthFromCookies } from "@/lib/auth-api";

export async function PATCH(req: Request) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth || auth.role !== "tour_guide") {
      return NextResponse.json({ message: "Forbidden. Tour guide access required." }, { status: 403 });
    }

    const body = (await req.json()) as {
      bookingId?: string | number;
      attendanceStatus?: "unchecked" | "attending" | "not_coming";
    };

    const { bookingId, attendanceStatus } = body;
    if (!bookingId || !attendanceStatus || !["unchecked", "attending", "not_coming"].includes(attendanceStatus)) {
      return NextResponse.json({ message: "Invalid booking ID or attendance status" }, { status: 400 });
    }

    await DbConnect();

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }

    const pkg = await TourPackage.findById(booking.packageId);
    if (!pkg || String(pkg.tourGuideId) !== String(auth.userId)) {
      return NextResponse.json({ message: "Forbidden. You are not the tour guide for this package." }, { status: 403 });
    }

    const updated = await Booking.updateAttendanceStatus(bookingId, attendanceStatus);
    return NextResponse.json({
      bookingId: String(updated?.id ?? bookingId),
      attendanceStatus: updated?.attendanceStatus ?? attendanceStatus,
    });
  } catch (error) {
    console.error("PATCH /api/guide/attendance:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
