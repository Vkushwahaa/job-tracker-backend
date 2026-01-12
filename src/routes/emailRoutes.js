import express from "express";
import {
  connectGmail,
  syncGmailOnce,
  gmailCallback,
  gmailStatus,
} from "../controllers/emailController.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

router.get("/gmail/connect", auth, connectGmail);
router.get("/gmail/callback", gmailCallback);
router.post("/gmail/sync", auth, syncGmailOnce);
router.get("/gmail/status", auth, gmailStatus);

// DEV ONLY (manual trigger)

export default router;
