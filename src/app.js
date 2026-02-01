import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import cookieParser from "cookie-parser";

const app = express();

const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("API is running...");
});
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
export default app;
