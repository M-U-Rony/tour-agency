import { NextResponse } from "next/server";
import { DbConnect } from "@/db/connection";
import { TourPackage, Booking, TripAnnouncement, CustomTripRequest } from "@/db/models";
import { getAuthFromCookies } from "@/lib/auth-api";
import { serializeTourPackage } from "@/lib/tour-package";
import { serializeCustomTripRequest } from "@/lib/custom-trip";

export async function GET() {
  try {
    const auth = await getAuthFromCookies();
    if (!auth || auth.role !== "tour_guide") {
      return NextResponse.json({ message: "Forbidden. Tour guide access required." }, { status: 403 });
    }

    await DbConnect();

    // Find packages and custom trips assigned to this tour guide
    const [packageRows, assignedCustomTrips] = await Promise.all([
      TourPackage.find(),
      CustomTripRequest.find({ tourGuideId: auth.userId }),
    ]);

    const assignedDocs = packageRows.filter(
      (p) => String(p.tourGuideId) === String(auth.userId)
    );

    const packageIds = assignedDocs.map((p) => p.id);
    const [bookingRows, announcementRows] = await Promise.all([
      Booking.findByPackageIds(packageIds),
      TripAnnouncement.findByPackageIds(packageIds),
    ]);

    const tours = assignedDocs.map((doc) => {
      const pkg = serializeTourPackage(doc);
      const packageBookings = bookingRows
        .filter((b) => b.packageId === doc.id)
        .map((b) => ({
          id: String(b.id),
          userName: b.userName,
          userEmail: b.userEmail,
          contactPhone: b.contactPhone,
          emergencyContact: b.emergencyContact,
          travelers: b.travelers,
          travelerNames: b.travelerNames ?? [],
          notes: b.notes ?? "",
          status: b.status,
          paymentStatus: b.paymentStatus,
          attendanceStatus: b.attendanceStatus ?? "unchecked",
          createdAt: b.createdAt.toISOString(),
        }));

      const packageAnnouncements = announcementRows
        .filter((a) => a.packageId === doc.id)
        .map((a) => ({
          id: String(a.id),
          title: a.title,
          message: a.message,
          createdAt: a.createdAt.toISOString(),
          guideName: a.guideName,
        }));

      const totalConfirmedTravelers = packageBookings
        .filter((b) => b.status === "confirmed" || b.status === "pending")
        .reduce((sum, b) => sum + b.travelers, 0);

      return {
        ...pkg,
        bookings: packageBookings,
        announcements: packageAnnouncements,
        totalConfirmedTravelers,
      };
    });

    return NextResponse.json({
      tours,
      customTrips: assignedCustomTrips.map(serializeCustomTripRequest),
    });
  } catch (error) {
    console.error("GET /api/guide/tours:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
