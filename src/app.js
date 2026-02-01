import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

import "./cron/emailCron.js";

const app = express();

/* ---------------- SECURITY MIDDLEWARE ---------------- */

app.use(
  helmet({
    contentSecurityPolicy: false, // needed for OAuth
  }),
);

app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  next();
});

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
});

app.use(globalLimiter);
/* ---------------- CORS ---------------- */

const allowedOrigins = ["http://localhost:3000", process.env.CLIENT_URL].filter(
  Boolean,
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

/* ---------------- PARSERS ---------------- */

app.use(express.json());
app.use(cookieParser());

/* ---------------- ROUTES ---------------- */

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/auth", authLimiter, emailRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/ai", aiRoutes);

export default app;
