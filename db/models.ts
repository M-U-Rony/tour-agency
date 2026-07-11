import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: String,
    email: {type: String, unique: true},
  profileImage: { type: String, default: "" },
  profilePage: { type: String, default: "" },
    password: String,
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
})

export const User = mongoose.models.User || mongoose.model("User", userSchema);

const tourPackageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    location: { type: String, required: true },
    duration: { type: String, required: true },
    priceBdt: { type: Number, required: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    shortDescription: { type: String, required: true },
    imageUrl: { type: String, required: true },
    galleryUrls: { type: [String], default: [] },
    itinerary: { type: [String], default: [] },
    inclusions: { type: [String], default: [] },
    exclusions: { type: [String], default: [] },
    pickupInfo: { type: String, default: "" },
    cancellationPolicy: { type: String, default: "" },
    availableDates: { type: [Date], default: [] },
    maxTravelers: { type: Number, default: 20, min: 1 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const TourPackage =
  mongoose.models.TourPackage || mongoose.model("TourPackage", tourPackageSchema);

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TourPackage",
      required: true,
      index: true,
    },
    travelDate: { type: Date, required: true },
    travelers: { type: Number, required: true, min: 1 },
    contactPhone: { type: String, required: true },
    notes: { type: String, default: "" },
    travelerNames: { type: [String], default: [] },
    emergencyContact: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "advance_due", "advance_paid", "paid", "refunded"],
      default: "unpaid",
      index: true,
    },
    paymentMethod: { type: String, default: "" },
    transactionId: { type: String, default: "" },
    adminNotes: { type: String, default: "" },
    totalPriceBdt: { type: Number, required: true },
  },
  { timestamps: true }
);

export const Booking =
  mongoose.models.Booking || mongoose.model("Booking", bookingSchema);

const customTripRequestSchema = new mongoose.Schema(
  {
    destination: { type: String, required: true },
    additionalDestinations: { type: String, default: "" },
    tripType: { type: String, required: true },
    departureDate: { type: Date, required: true },
    returnDate: { type: Date, required: true },
    travelers: { type: Number, required: true, min: 1 },
    children: { type: Number, default: 0, min: 0 },
    budget: { type: String, required: true },
    accommodation: { type: String, default: "" },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    notes: { type: String, default: "" },
    status: {
      type: String,
      enum: ["new", "contacted", "quoted", "closed"],
      default: "new",
      index: true,
    },
    adminNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

export const CustomTripRequest =
  mongoose.models.CustomTripRequest ||
  mongoose.model("CustomTripRequest", customTripRequestSchema);

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TourPackage",
      required: true,
      index: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

export const Review =
  mongoose.models.Review || mongoose.model("Review", reviewSchema);
