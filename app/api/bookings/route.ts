import { NextResponse } from "next/server";
import { DbConnect } from "@/db/connection";
import { Booking, TourPackage, User } from "@/db/models";
import { createBookingSchema } from "@/utils/zod/types";
import { getAuthFromCookies } from "@/lib/auth-api";
import {
  type PaymentStatus,
  parseTravelDateFromClient,
  serializeBooking,
  travelDateIsBeforeLocalToday,
} from "@/lib/booking";

export async function GET(req: Request) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const wantAll = url.searchParams.get("all") === "true";

    await DbConnect();

    const filter =
      wantAll && auth.role === "admin" ? {} : { userId: auth.userId };

    const docs = await Booking.find(filter);

    const packageIds = Array.from(new Set(docs.map((d) => String(d.packageId))));
    const userIds = Array.from(new Set(docs.map((d) => String(d.userId))));

    const [packages, users] = await Promise.all([
      packageIds.length
        ? TourPackage.find({ filter: { _id: { $in: packageIds } } })
        : Promise.resolve([]),
      wantAll && auth.role === "admin" && userIds.length
        ? User.find({ _id: { $in: userIds } })
        : Promise.resolve([]),
    ]);

    const pkgById = new Map(packages.map((p) => [String(p._id), p]));
    const userById = new Map(users.map((u) => [String(u._id), u]));

    const bookings = docs.map((d) =>
      serializeBooking(
        d,
        pkgById.get(String(d.packageId)) ?? null,
        userById.get(String(d.userId)) ?? null
      )
    );

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("GET bookings:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (auth.role === "admin") {
      return NextResponse.json(
        { message: "Admins cannot create booking requests" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { packageId, travelDate, travelers, contactPhone, notes } = parsed.data;
    const {
      travelerNames,
      emergencyContact,
      paymentMethod,
      transactionId,
    } = parsed.data;

    await DbConnect();
    const pkg = await TourPackage.findById(packageId);
    if (!pkg) {
      return NextResponse.json({ message: "Package not found" }, { status: 404 });
    }

    let date = parseTravelDateFromClient(travelDate);
    if (!date) {
      if (pkg.startDate) {
        date = new Date(pkg.startDate);
      } else if (pkg.availableDates && pkg.availableDates.length > 0) {
        date = new Date(pkg.availableDates[0]);
      } else {
        date = new Date();
      }
    }

    if (pkg.availableSeats < travelers) {
      return NextResponse.json(
        {
          message:
            pkg.availableSeats <= 0
              ? "This tour package is currently sold out."
              : `Cannot request ${travelers} travelers. Only ${pkg.availableSeats} seat(s) remaining for this tour.`,
        },
        { status: 400 }
      );
    }

    const totalPriceBdt = travelers * pkg.priceBdt;

    const created = await Booking.create({
      userId: auth.userId,
      packageId,
      travelDate: date,
      travelers,
      contactPhone,
      notes: notes ?? "",
      travelerNames,
      emergencyContact,
      status: "pending",
      paymentStatus:
        paymentMethod || transactionId ? ("advance_due" as PaymentStatus) : "unpaid",
      paymentMethod,
      transactionId,
      totalPriceBdt,
    });

    await TourPackage.decrementAvailableSeats(packageId, travelers);

    const booking = serializeBooking(created, pkg);
    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error("POST bookings:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
