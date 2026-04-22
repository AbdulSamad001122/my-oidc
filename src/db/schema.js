import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            maxlength: 25,
            trim: true,
        },
        lastName: {
            type: String,
            maxlength: 25,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            maxlength: 322,
            unique: true,
            lowercase: true,
            trim: true,
        },
        emailVerified: {
            type: Boolean,
            default: false,
        },
        password: {
            type: String,
            maxlength: 66, // SHA-256 hex
            default: null,
        },
        salt: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: {
            createdAt: "createdAt",
            updatedAt: "updatedAt",
        },
    }
);

export const User = mongoose.model("User", userSchema);