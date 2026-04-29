import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import connectDB from "./db/db.connect.js";
import oidcRoutes from "./routes/oidc.routes.js";

const app = express();
const PORT = process.env.PORT ?? 8000;

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.resolve("public")));

// Ensure DB connection for serverless endpoints
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection failed:", error);
    res.status(500).json({ error: "Internal Server Error", message: "Database connection failed" });
  }
});

// Basic Routes
app.get("/", (req, res) => res.json({ message: "Hello from Auth Server" }));

app.get("/health", (req, res) =>
  res.json({ message: "Server is healthy", healthy: true }),
);

// OIDC & Auth Routes
app.use("/", oidcRoutes);

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  app.listen(PORT, async () => {
    await connectDB();
    console.log(`AuthServer is running on PORT ${PORT}`);
  });
}

export default app;