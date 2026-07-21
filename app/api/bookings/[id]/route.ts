import { NextResponse } from "next/server";
import { DbConnect } from "@/db/connection";
import { Booking, TourPackage } from "@/db/models";
import { updateBookingStatusSchema } from "@/utils/zod/types";
import { getAuthFromCookies } from "@/lib/auth-api";
import { serializeBooking } from "@/lib/booking";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = updateBookingStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await DbConnect();
    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }

    const isOwner = String(booking.userId) === auth.userId;
    const isAdmin = auth.role === "admin";

    if (!isAdmin) {
      if (!isOwner) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
      if (parsed.data.status !== "cancelled") {
        return NextResponse.json(
          { message: "Users can only cancel their own bookings" },
          { status: 403 }
        );
      }
      if (booking.status !== "pending") {
        return NextResponse.json(
          { message: "Only pending bookings can be cancelled" },
          { status: 400 }
        );
      }
    }

    const updates: Parameters<typeof Booking.findByIdAndUpdate>[1] = {};
    if (isAdmin) {
      if (parsed.data.status) updates.status = parsed.data.status;
      if (parsed.data.paymentStatus) updates.paymentStatus = parsed.data.paymentStatus;
      if (parsed.data.paymentMethod !== undefined) {
        updates.paymentMethod = parsed.data.paymentMethod;
      }
      if (parsed.data.transactionId !== undefined) {
        updates.transactionId = parsed.data.transactionId;
      }
      if (parsed.data.adminNotes !== undefined) {
        updates.adminNotes = parsed.data.adminNotes;
      }
    } else {
      updates.status = "cancelled";
    }

    const updated = await Booking.findByIdAndUpdate(id, updates);
    if (!updated) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }

    const pkg = await TourPackage.findById(updated.packageId);
    const dto = serializeBooking(updated, pkg);
    return NextResponse.json({ booking: dto });
  } catch (error) {
    console.error("PATCH booking:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    await DbConnect();
    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }
    if (auth.role !== "admin" && String(booking.userId) !== auth.userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const pkg = await TourPackage.findById(booking.packageId);

    return NextResponse.json({ booking: serializeBooking(booking, pkg) });
  } catch (error) {
    console.error("GET booking:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
