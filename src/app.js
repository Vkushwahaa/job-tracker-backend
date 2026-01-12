import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import cookieParser from "cookie-parser";
import "./cron/emailCron.js";
import emailRoutes from "./routes/emailRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

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
app.use("/api/auth", emailRoutes);
app.use("/api/ai", aiRoutes);

export default app;
