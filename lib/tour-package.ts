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
  maxTravelers?: number;
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
  maxTravelers?: number;
  isActive?: boolean;
}): TourPackageDTO {
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
    maxTravelers: doc.maxTravelers ?? 20,
    isActive: doc.isActive ?? true,
  };
}
