import { NextResponse } from "next/server";
import { DbConnect } from "@/db/connection";
import { TourPackage } from "@/db/models";
import { createTourPackageSchema } from "@/utils/zod/types";
import { getAuthFromCookies } from "@/lib/auth-api";
import { serializeTourPackage } from "@/lib/tour-package";

export async function GET() {
  try {
    await DbConnect();
    const docs = await TourPackage.find().sort({ createdAt: -1 }).lean();
    const packages = docs.map((doc) =>
      serializeTourPackage({
        _id: doc._id,
        title: doc.title,
        location: doc.location,
        duration: doc.duration,
        priceBdt: doc.priceBdt,
        rating: doc.rating,
        shortDescription: doc.shortDescription,
        imageUrl: doc.imageUrl,
      })
    );
    return NextResponse.json({ packages });
  } catch (error) {
    console.error("GET tour-packages:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createTourPackageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await DbConnect();
    const doc = await TourPackage.create({ ...parsed.data, rating: 0 });
    const pkg = serializeTourPackage(doc.toObject());
    return NextResponse.json({ package: pkg }, { status: 201 });
  } catch (error) {
    console.error("POST tour-packages:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
