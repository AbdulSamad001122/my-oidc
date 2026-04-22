import "dotenv/config";
import express from "express";
import path from "node:path";
import connectDB from "./db/db.connect.js";
import oidcRoutes from "./routes/oidc.routes.js";

const app = express();
const PORT = process.env.PORT ?? 8000;

app.use(express.json());
app.use(express.static(path.resolve("public")));

// Basic Routes
app.get("/", (req, res) => res.json({ message: "Hello from Auth Server" }));

app.get("/health", (req, res) =>
  res.json({ message: "Server is healthy", healthy: true }),
);

// OIDC & Auth Routes
app.use("/", oidcRoutes);

app.listen(PORT, async () => {
  await connectDB();
  console.log(`AuthServer is running on PORT ${PORT}`);
});