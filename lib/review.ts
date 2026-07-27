export type ReviewDTO = {
  id: string;
  packageId: string;
  bookingId: string;
  rating: number;
  comment: string;
  createdAt: string;
  user?: {
    id: string;
    username: string;
  } | null;
};

export type LandingReviewDTO = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  userName: string;
  packageTitle: string;
  packageLocation: string;
};

export function serializeReview(
  doc: {
    _id: unknown;
    packageId: unknown;
    bookingId: unknown;
    rating: number;
    comment: string;
    createdAt: Date | string;
  },
  user?: { _id: unknown; name?: string } | null
): ReviewDTO {
  return {
    id: String(doc._id),
    packageId: String(doc.packageId),
    bookingId: String(doc.bookingId),
    rating: doc.rating,
    comment: doc.comment,
    createdAt: new Date(doc.createdAt).toISOString(),
    user: user ? { id: String(user._id), username: user.name ?? "" } : null,
  };
}
