export type CustomTripStatus = "new" | "contacted" | "quoted" | "closed";

export type CustomTripRequestDTO = {
  id: string;
  destination: string;
  additionalDestinations: string;
  tripType: string;
  departureDate: string;
  returnDate: string;
  travelers: number;
  children: number;
  budget: string;
  accommodation: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  status: CustomTripStatus;
  adminNotes: string;
  userId?: string | null;
  tourGuideId?: string | null;
  tourGuide?: {
    id: string;
    name: string;
    email: string;
    profileImage: string;
  } | null;
  createdAt: string;
};

export const CUSTOM_TRIP_STATUS_LABEL: Record<CustomTripStatus, string> = {
  new: "New",
  contacted: "Contacted",
  quoted: "Quoted",
  closed: "Closed",
};

export function serializeCustomTripRequest(doc: {
  _id: unknown;
  destination: string;
  additionalDestinations?: string;
  tripType: string;
  departureDate: Date | string;
  returnDate: Date | string;
  travelers: number;
  children?: number;
  budget: string;
  accommodation?: string;
  name: string;
  email: string;
  phone: string;
  notes?: string;
  status?: CustomTripStatus;
  adminNotes?: string;
  userId?: unknown;
  tourGuideId?: unknown;
  tourGuide?: {
    id: string;
    name: string;
    email: string;
    profileImage: string;
  } | null;
  createdAt: Date | string;
}): CustomTripRequestDTO {
  return {
    id: String(doc._id),
    destination: doc.destination,
    additionalDestinations: doc.additionalDestinations ?? "",
    tripType: doc.tripType,
    departureDate: new Date(doc.departureDate).toISOString(),
    returnDate: new Date(doc.returnDate).toISOString(),
    travelers: doc.travelers,
    children: doc.children ?? 0,
    budget: doc.budget,
    accommodation: doc.accommodation ?? "",
    name: doc.name,
    email: doc.email,
    phone: doc.phone,
    notes: doc.notes ?? "",
    status: doc.status ?? "new",
    adminNotes: doc.adminNotes ?? "",
    userId: doc.userId ? String(doc.userId) : null,
    tourGuideId: doc.tourGuideId ? String(doc.tourGuideId) : null,
    tourGuide: doc.tourGuide ?? null,
    createdAt: new Date(doc.createdAt).toISOString(),
  };
}
