export type TourPackageDTO = {
  id: string;
  title: string;
  location: string;
  duration: string;
  priceBdt: number;
  rating: number;
  shortDescription: string;
  imageUrl: string;
  galleryUrls?: string[];
  itinerary?: string[];
  inclusions?: string[];
  exclusions?: string[];
  pickupInfo?: string;
  cancellationPolicy?: string;
  availableDates?: string[];
  startDate?: string;
  endDate?: string;
  totalSeats?: number;
  availableSeats?: number;
  isActive?: boolean;
};

export function formatBdt(amount: number): string {
  return `৳${amount.toLocaleString("en-BD")}`;
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export function serializeTourPackage(doc: {
  _id: unknown;
  title: string;
  location: string;
  duration: string;
  priceBdt: number;
  rating?: number;
  shortDescription: string;
  imageUrl: string;
  galleryUrls?: string[];
  itinerary?: string[];
  inclusions?: string[];
  exclusions?: string[];
  pickupInfo?: string;
  cancellationPolicy?: string;
  availableDates?: Array<Date | string>;
  startDate?: Date | string;
  endDate?: Date | string;
  totalSeats?: number;
  availableSeats?: number;
  isActive?: boolean;
}): TourPackageDTO {
  const total = doc.totalSeats ?? 20;
  return {
    id: String(doc._id),
    title: doc.title,
    location: doc.location,
    duration: doc.duration,
    priceBdt: doc.priceBdt,
    rating: doc.rating ?? 0,
    shortDescription: doc.shortDescription,
    imageUrl: doc.imageUrl,
    galleryUrls: doc.galleryUrls ?? [],
    itinerary: doc.itinerary ?? [],
    inclusions: doc.inclusions ?? [],
    exclusions: doc.exclusions ?? [],
    pickupInfo: doc.pickupInfo ?? "",
    cancellationPolicy: doc.cancellationPolicy ?? "",
    availableDates: (doc.availableDates ?? []).map(toIso),
    startDate: doc.startDate ? toIso(doc.startDate) : undefined,
    endDate: doc.endDate ? toIso(doc.endDate) : undefined,
    totalSeats: total,
    availableSeats: doc.availableSeats ?? total,
    isActive: doc.isActive ?? true,
  };
}

export function isTourUpcoming(pkg: TourPackageDTO): boolean {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  if (pkg.startDate) {
    const start = new Date(pkg.startDate).getTime();
    if (!Number.isNaN(start)) return start >= startOfToday;
  }
  if (pkg.endDate) {
    const end = new Date(pkg.endDate).getTime();
    if (!Number.isNaN(end)) return end >= startOfToday;
  }

  if (pkg.availableDates && pkg.availableDates.length > 0) {
    return pkg.availableDates.some((d) => {
      const date = new Date(d);
      return !Number.isNaN(date.getTime()) && date.getTime() >= startOfToday;
    });
  }
  return true;
}
