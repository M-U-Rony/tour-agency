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

const packageImageRef = z
  .string()
  .min(1)
  .max(2048)
  .refine(isValidPackageImageRef, "Must be a valid image URL or an uploaded path");

export const createTourPackageSchema = z.object({
    title: z.string().min(1).max(200),
    location: z.string().min(1).max(200),
    duration: z.string().min(1).max(100),
    priceBdt: z.number().positive(),
    shortDescription: z.string().min(1).max(500),
    imageUrl: packageImageRef,
})

export const updateTourPackageSchema = createTourPackageSchema.partial()

export const createBookingSchema = z.object({
    packageId: z.string().min(1),
    travelDate: z.string().min(1),
    travelers: z.number().int().min(1).max(50),
    contactPhone: z.string().min(5).max(40),
    notes: z.string().max(1000).optional().default(""),
})

export const updateBookingStatusSchema = z.object({
    status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
})