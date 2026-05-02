import { NextResponse } from "next/server";
import { DbConnect } from "@/db/connection";
import { Booking, TourPackage, User } from "@/db/models";
import { createBookingSchema } from "@/utils/zod/types";
import { getAuthFromCookies } from "@/lib/auth-api";
import { parseTravelDateFromClient, serializeBooking } from "@/lib/booking";

type LeanPackage = {
  _id: unknown;
  title: string;
  location: string;
  duration: string;
  imageUrl: string;
  priceBdt: number;
};

type LeanUser = {
  _id: unknown;
  name: string;
  email: string;
};

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

    const docs = await Booking.find(filter).sort({ createdAt: -1 }).lean();

    const packageIds = Array.from(new Set(docs.map((d) => String(d.packageId))));
    const userIds = Array.from(new Set(docs.map((d) => String(d.userId))));

    const [packages, users] = await Promise.all([
      packageIds.length
        ? (TourPackage.find({ _id: { $in: packageIds } })
            .select("title location duration imageUrl priceBdt")
            .lean() as Promise<LeanPackage[]>)
        : Promise.resolve([] as LeanPackage[]),
      wantAll && auth.role === "admin" && userIds.length
        ? (User.find({ _id: { $in: userIds } })
            .select("name email")
            .lean() as Promise<LeanUser[]>)
        : Promise.resolve([] as LeanUser[]),
    ]);

    const pkgById = new Map(packages.map((p) => [String(p._id), p]));
    const userById = new Map(users.map((u) => [String(u._id), u]));

    const bookings = docs.map((d) =>
      serializeBooking(
        {
          _id: d._id,
          userId: d.userId,
          packageId: d.packageId,
          travelDate: d.travelDate,
          travelers: d.travelers,
          contactPhone: d.contactPhone,
          notes: d.notes,
          status: d.status,
          totalPriceBdt: d.totalPriceBdt,
          createdAt: d.createdAt,
        },
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

    const date = parseTravelDateFromClient(travelDate);
    if (!date) {
      return NextResponse.json({ message: "Invalid travel date" }, { status: 400 });
    }

    await DbConnect();
    const pkg = await TourPackage.findById(packageId).lean<LeanPackage | null>();
    if (!pkg) {
      return NextResponse.json({ message: "Package not found" }, { status: 404 });
    }

    const totalPriceBdt = travelers * pkg.priceBdt;

    const created = await Booking.create({
      userId: auth.userId,
      packageId,
      travelDate: date,
      travelers,
      contactPhone,
      notes: notes ?? "",
      status: "pending",
      totalPriceBdt,
    });

    const booking = serializeBooking(created.toObject(), pkg);
    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error("POST bookings:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
