// routes/ai.js
import express from "express";
import { parseEmailWithAI } from "../controllers/aiController.js";

const router = express.Router();

router.post("/parse-email", parseEmailWithAI);

export default router;
