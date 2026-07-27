import { NextResponse } from "next/server";
import { DbConnect } from "@/db/connection";
import { Booking, TourPackage, Payment } from "@/db/models";
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
      if (booking.status === "cancelled" || booking.status === "completed") {
        return NextResponse.json(
          { message: "Cancelled or completed bookings cannot be edited" },
          { status: 400 }
        );
      }
    }

    const updates: Parameters<typeof Booking.findByIdAndUpdate>[1] = {};

    if (isAdmin) {
      if (parsed.data.status) updates.status = parsed.data.status;
      if (parsed.data.paymentStatus) updates.paymentStatus = parsed.data.paymentStatus;
      if (parsed.data.paymentMethod !== undefined) updates.paymentMethod = parsed.data.paymentMethod;
      if (parsed.data.transactionId !== undefined) updates.transactionId = parsed.data.transactionId;
      if (parsed.data.adminNotes !== undefined) updates.adminNotes = parsed.data.adminNotes;
      if (parsed.data.travelers !== undefined) updates.travelers = parsed.data.travelers;
      if (parsed.data.contactPhone !== undefined) updates.contactPhone = parsed.data.contactPhone;
      if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes;
      if (parsed.data.travelerNames !== undefined) updates.travelerNames = parsed.data.travelerNames;
      if (parsed.data.emergencyContact !== undefined) updates.emergencyContact = parsed.data.emergencyContact;
    } else {
      // User owner actions: edit fields or cancel
      if (parsed.data.status === "cancelled") {
        updates.status = "cancelled";
        // Restore package available seats on cancellation
        await TourPackage.incrementAvailableSeats(booking.packageId, booking.travelers);
      } else {
        if (parsed.data.contactPhone !== undefined) updates.contactPhone = parsed.data.contactPhone;
        if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes;
        if (parsed.data.travelerNames !== undefined) updates.travelerNames = parsed.data.travelerNames;
        if (parsed.data.emergencyContact !== undefined) updates.emergencyContact = parsed.data.emergencyContact;
        if (parsed.data.paymentMethod !== undefined) updates.paymentMethod = parsed.data.paymentMethod;
        if (parsed.data.transactionId !== undefined) updates.transactionId = parsed.data.transactionId;
        if (parsed.data.travelDate !== undefined) updates.travelDate = new Date(parsed.data.travelDate);

        if (parsed.data.travelers !== undefined && parsed.data.travelers !== booking.travelers) {
          const newTravelers = parsed.data.travelers;
          const diff = newTravelers - booking.travelers;
          const pkg = await TourPackage.findById(booking.packageId);
          if (pkg) {
            if (diff > 0 && pkg.availableSeats < diff) {
              return NextResponse.json(
                { message: `Only ${pkg.availableSeats} seat(s) remaining` },
                { status: 400 }
              );
            }
            if (diff > 0) {
              await TourPackage.decrementAvailableSeats(booking.packageId, diff);
            } else if (diff < 0) {
              await TourPackage.incrementAvailableSeats(booking.packageId, Math.abs(diff));
            }
            updates.travelers = newTravelers;
            updates.totalPriceBdt = newTravelers * pkg.priceBdt;
          }
        }
      }
    }

    const updated = await Booking.findByIdAndUpdate(id, updates);
    if (!updated) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }

    // Sync status with payments table
    try {
      const existingPayments = await Payment.find({ bookingId: id });
      const targetPayment = existingPayments[0];
      let newPaymentStatus: "pending" | "completed" | "failed" | "refunded" | undefined;

      if (updates.paymentStatus === "paid" || updates.paymentStatus === "advance_paid") {
        newPaymentStatus = "completed";
      } else if (updates.paymentStatus === "refunded") {
        newPaymentStatus = "refunded";
      } else if (updates.status === "cancelled") {
        newPaymentStatus = "failed";
      }

      if (targetPayment && newPaymentStatus) {
        await Payment.findByIdAndUpdate(targetPayment.id, { status: newPaymentStatus });
      }
    } catch (payErr) {
      console.error("Failed to sync payment status:", payErr);
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
