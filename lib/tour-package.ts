export type TourPackageDTO = {
  id: string;
  title: string;
  location: string;
  duration: string;
  priceBdt: number;
  rating: number;
  shortDescription: string;
  imageUrl: string;
};

export function formatBdt(amount: number): string {
  return `৳${amount.toLocaleString("en-BD")}`;
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
  };
}
