import { z } from "zod";
import { isValidPackageImageRef } from "@/lib/package-image-url";

export const createUserSchema = z.object({
    name: z.string().min(1, "Name must be at least 1 characters long"),
    email: z.email("Invalid email address"),
    password: z.string().min(2, "Password must be at least 2 characters long"),
})

export const loginUserSchema = z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(2, "Password must be at least 2 characters long"),
})

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.email().optional(),
  password: z.string().min(2).optional(),
  profileImage: z.string().min(1).optional(),
  profilePage: z.string().min(1).optional(),
})

export const adminUpdateUserSchema = updateUserSchema.extend({
  role: z.enum(["user", "admin"]).optional(),
});

const packageImageRef = z
  .string()
  .min(1, "Image path or URL is required")
  .max(4096);

const packageImageRefs = z
  .array(packageImageRef)
  .max(20)
  .optional()
  .default([]);

const stringList = z.array(z.string().trim().min(1).max(1000)).max(50).optional().default([]);

export const createTourPackageSchema = z.object({
    title: z.string().min(1, "Title is required").max(500),
    location: z.string().min(1, "Location is required").max(500),
    duration: z.string().min(1, "Duration is required").max(300),
    priceBdt: z.number().positive("Price must be greater than 0"),
    shortDescription: z.string().min(1, "Short description is required").max(5000),
    imageUrl: packageImageRef,
    galleryUrls: packageImageRefs,
    itinerary: stringList,
    inclusions: stringList,
    exclusions: stringList,
    pickupInfo: z.string().max(3000).optional().default(""),
    cancellationPolicy: z.string().max(3000).optional().default(""),
    availableDates: z.array(z.string().min(1)).max(100).optional().default([]),
    startDate: z.string().optional().default(""),
    endDate: z.string().optional().default(""),
    totalSeats: z.coerce.number().int().min(1).max(10000).optional().default(20),
    availableSeats: z.coerce.number().int().min(0).max(10000).optional(),
    tourGuideId: z.coerce.number().int().nullable().optional(),
    isActive: z.boolean().optional().default(true),
})

export const updateTourPackageSchema = createTourPackageSchema.partial()

export const createBookingSchema = z.object({
    packageId: z.string().min(1),
    travelDate: z.string().optional().default(""),
    travelers: z.number().int().min(1).max(50),
    contactPhone: z.string().min(5).max(40),
    notes: z.string().max(1000).optional().default(""),
    travelerNames: z.array(z.string().trim().min(1).max(120)).max(50).optional().default([]),
    emergencyContact: z.string().max(120).optional().default(""),
    paymentMethod: z.string().max(80).optional().default(""),
    transactionId: z.string().max(120).optional().default(""),
})

export const updateBookingStatusSchema = z.object({
    status: z.enum(["pending", "confirmed", "cancelled", "completed"]).optional(),
    paymentStatus: z
      .enum(["unpaid", "advance_due", "advance_paid", "paid", "refunded"])
      .optional(),
    paymentMethod: z.string().max(80).optional(),
    transactionId: z.string().max(120).optional(),
    adminNotes: z.string().max(1500).optional(),
})

export const customTripRequestSchema = z.object({
  destination: z.string().min(1).max(200),
  additionalDestinations: z.string().max(300).optional().default(""),
  tripType: z.string().min(1).max(120),
  departureDate: z.string().min(1),
  returnDate: z.string().min(1),
  travelers: z.number().int().min(1).max(200),
  children: z.number().int().min(0).max(100).optional().default(0),
  budget: z.string().min(1).max(120),
  accommodation: z.string().max(120).optional().default(""),
  name: z.string().max(120).optional().default(""),
  email: z.string().optional().default(""),
  phone: z.string().max(40).optional().default(""),
  notes: z.string().max(1500).optional().default(""),
});

export const updateCustomTripRequestSchema = z.object({
  status: z.enum(["new", "contacted", "quoted", "closed"]).optional(),
  adminNotes: z.string().max(1500).optional(),
});

export const createReviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(5).max(1000),
});
