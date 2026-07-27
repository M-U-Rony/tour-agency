"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, Calendar, CheckCircle2, Lock, AlertCircle, MessageSquare } from "lucide-react";
import type { ReviewDTO } from "@/lib/review";
import { formatTravelDate } from "@/lib/booking";

export type UserBookingForPackage = {
  id: string;
  travelDate: string;
  status: string;
  hasReviewed: boolean;
};

interface PackageReviewsProps {
  packageId: string;
  initialReviews: ReviewDTO[];
  isAuthed: boolean;
  userBookings: UserBookingForPackage[];
  currentUserId?: string;
}

export default function PackageReviews({
  packageId,
  initialReviews,
  isAuthed,
  userBookings,
  currentUserId,
}: PackageReviewsProps) {
  const [reviews, setReviews] = useState<ReviewDTO[]>(initialReviews);
  const [userBookingsState, setUserBookingsState] = useState<UserBookingForPackage[]>(userBookings);

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  // Calculate average rating dynamically
  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
      : null;

  // Only confirmed or completed bookings are eligible for review
  const hasBooking = userBookingsState.length > 0;
  const confirmedBookings = userBookingsState.filter(
    (b) => b.status === "confirmed" || b.status === "completed"
  );
  const pendingBookings = userBookingsState.filter((b) => b.status === "pending");

  const now = Date.now();

  // 1. Confirmed by admin & tour date has passed & not reviewed yet
  const eligibleBookingToReview = confirmedBookings.find((b) => {
    if (b.hasReviewed) return false;
    const isEnded = b.status === "completed" || new Date(b.travelDate).getTime() <= now;
    return isEnded;
  });

  // 2. Confirmed by admin but tour date has NOT passed yet
  const confirmedUpcomingBooking = confirmedBookings.find((b) => {
    if (b.hasReviewed) return false;
    const isEnded = b.status === "completed" || new Date(b.travelDate).getTime() <= now;
    return !isEnded;
  });

  // 3. Pending admin confirmation
  const pendingBooking = pendingBookings.find((b) => !b.hasReviewed);

  // 4. Reviewed
  const hasReviewedAny = userBookingsState.some((b) => b.hasReviewed);

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!eligibleBookingToReview) return;
    if (comment.trim().length < 5) {
      setErrorMsg("Please enter at least 5 characters for your review.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          bookingId: eligibleBookingToReview.id,
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to submit review");
      }

      // Append review
      setReviews((prev) => [data.review, ...prev]);

      // Update local booking state
      setUserBookingsState((prev) =>
        prev.map((b) =>
          b.id === eligibleBookingToReview.id ? { ...b, hasReviewed: true } : b
        )
      );

      setSuccessMsg("Thank you! Your review has been submitted.");
      setComment("");
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while submitting your review.");
    } finally {
      setSubmitting(false);
    }
  }

  const RATING_LABELS: Record<number, string> = {
    1: "1 - Poor",
    2: "2 - Fair",
    3: "3 - Good",
    4: "4 - Very Good",
    5: "5 - Excellent",
  };

  return (
    <section className="mt-12">
      {/* Header & Overall Rating */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-100 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Traveler Reviews
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Real feedback from verified travelers who completed this tour
          </p>
        </div>
        {avgRating ? (
          <div className="flex items-center gap-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl px-4 py-2 self-start sm:self-auto">
            <div className="flex items-center gap-1 text-amber-500">
              <Star size={20} className="fill-current" />
              <span className="text-xl font-extrabold text-amber-900">{avgRating}</span>
            </div>
            <div className="h-6 w-px bg-amber-200" />
            <span className="text-xs font-semibold text-amber-800">
              {totalReviews} verified review{totalReviews === 1 ? "" : "s"}
            </span>
          </div>
        ) : (
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full self-start sm:self-auto">
            No reviews yet
          </span>
        )}
      </div>

      {/* Review Submission / Status Card */}
      <div className="mt-6">
        {!isAuthed ? (
          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50/60 to-teal-50/60 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-800">
                <Lock size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Booked this trip?
                </p>
                <p className="text-xs text-slate-600">
                  Sign in to write a review after your travel date has passed.
                </p>
              </div>
            </div>
            <Link
              href="/signin"
              className="inline-flex items-center justify-center rounded-xl bg-teal-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-800 transition-colors shrink-0"
            >
              Sign in to review
            </Link>
          </div>
        ) : !hasBooking ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 flex items-start gap-3 text-slate-600">
            <AlertCircle size={18} className="text-slate-400 mt-0.5 shrink-0" />
            <p className="text-xs leading-relaxed">
              Only travelers who have booked this tour can leave a review. Book this package to share your feedback once your trip date expires!
            </p>
          </div>
        ) : eligibleBookingToReview ? (
          <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-teal-800 font-bold text-base mb-1">
              <MessageSquare size={18} /> Write a Review
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Your trip date has passed! Share your experience to help future travelers.
            </p>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Your Rating
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = (hoverRating || rating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 text-amber-400 hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                          aria-label={`Rate ${star} stars`}
                        >
                          <Star
                            size={24}
                            className={active ? "fill-current text-amber-400" : "text-slate-300"}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-xs font-semibold text-slate-600">
                    {RATING_LABELS[hoverRating || rating]}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Your Experience
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  placeholder="What did you enjoy most about this tour? Mention guides, itinerary, comfort, or tips for others..."
                  className="w-full rounded-xl border border-slate-200 p-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition-all resize-y"
                  required
                />
              </div>

              {errorMsg && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 size={16} /> {successMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || comment.trim().length < 5}
                className="inline-flex items-center justify-center rounded-xl bg-teal-700 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-800 disabled:opacity-60 transition-colors cursor-pointer"
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          </div>
        ) : confirmedUpcomingBooking ? (
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-5 flex items-start gap-3.5 text-amber-900">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <Calendar size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold">Review Unlocks After Tour Ends</p>
              <p className="text-xs text-amber-800/90 mt-0.5 leading-relaxed">
                Your booking for <span className="font-bold">{formatTravelDate(confirmedUpcomingBooking.travelDate)}</span> is confirmed by admin.
                You can submit your review once your tour date has passed!
              </p>
            </div>
          </div>
        ) : pendingBooking ? (
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-5 flex items-start gap-3.5 text-amber-900">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <Lock size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold">Awaiting Admin Confirmation</p>
              <p className="text-xs text-amber-800/90 mt-0.5 leading-relaxed">
                Your booking request is currently pending admin review. Once confirmed by an admin and your tour date has passed, you will be able to leave a review!
              </p>
            </div>
          </div>
        ) : hasReviewedAny ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 flex items-center gap-3 text-emerald-900">
            <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
            <p className="text-xs font-medium">
              You have already reviewed your trip for this package. Thank you for sharing your feedback!
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 flex items-start gap-3 text-slate-700">
            <Lock size={18} className="text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-800">Reviewing is Restricted</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Only travelers with an admin-confirmed booking after their tour date has passed can post a review.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Reviews List */}
      <div className="mt-8">
        {reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-emerald-200 bg-white p-8 text-center">
            <MessageSquare size={32} className="mx-auto text-emerald-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No reviews yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Be the first traveler to share feedback after completing this tour!
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {reviews.map((rev) => {
              const isUserReview = currentUserId && rev.user?.id === currentUserId;
              const dateFormatted = new Date(rev.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });

              return (
                <article
                  key={rev.id}
                  className={`rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${
                    isUserReview ? "border-teal-300 ring-1 ring-teal-200" : "border-emerald-100"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 font-bold text-teal-800 text-xs uppercase">
                        {(rev.user?.username || "T")[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900">
                            {rev.user?.username || "Verified Traveler"}
                          </p>
                          {isUserReview && (
                            <span className="rounded-full bg-teal-50 border border-teal-200 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                              Your review
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">{dateFormatted}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 rounded-full bg-amber-50 border border-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                      <Star size={13} className="fill-current" />
                      <span>{rev.rating}</span>
                    </div>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                    {rev.comment}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
