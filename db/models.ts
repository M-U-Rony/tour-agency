import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: String,
    email: {type: String, unique: true},
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
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
      index: true,
    },
    totalPriceBdt: { type: Number, required: true },
  },
  { timestamps: true }
);

export const Booking =
  mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
