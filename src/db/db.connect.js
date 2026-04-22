import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const MONGO_URI = process.env.MONGODB_URI

        if (!MONGO_URI) {
            throw new Error("Please provide a valid MongoDB URI")
        }

        await mongoose.connect(MONGO_URI);
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
};

export default connectDB;