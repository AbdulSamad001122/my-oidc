import mongoose from "mongoose";

let isConnected = false;

const connectDB = async () => {
    if (isConnected) return;
    try {
        const MONGO_URI = process.env.MONGODB_URI;

        if (!MONGO_URI) {
            throw new Error("Please provide a valid MongoDB URI");
        }

        const db = await mongoose.connect(MONGO_URI);
        isConnected = db.connections[0].readyState === 1;
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
};

export default connectDB;