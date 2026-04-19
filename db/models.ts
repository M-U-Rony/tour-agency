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
