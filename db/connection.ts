import mongoose from "mongoose";
import dns from "node:dns";

// Dynamically set public DNS servers to resolve MongoDB SRV records (fixes ECONNREFUSED/querySrv)
try {
  dns.setServers(["1.1.1.1", "8.8.8.8"]);
} catch (err) {
  console.warn("Failed to set custom DNS servers:", err);
}

export const DbConnect = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("Please provide MONGODB_URI in the environment variables");
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        throw error;
    }
}
