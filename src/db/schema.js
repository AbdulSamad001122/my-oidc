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
            maxlength: 66, 
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

const clientSchema = new mongoose.Schema({
    clientId: { type: String, required: true, unique: true },
    clientSecret: { type: String, required: true },
    redirectUris: { type: [String], required: true },
    name: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

export const Client = mongoose.model("Client", clientSchema);

const authCodeSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    clientId: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    redirectUri: { type: String, required: true },
    expiresAt: { type: Date, required: true }
});

export const AuthCode = mongoose.model("AuthCode", authCodeSchema);
