import express from "express";
import { auth } from "../middlewares/auth.js";
import {
  createJob,
  updateJob,
  getJobs,
  deleteJob,
  getSingleJob,
} from "../controllers/jobController.js";

const router = express.Router();

router.post("/", auth, createJob);
router.get("/", auth, getJobs);
router.put("/:id", auth, updateJob);
router.delete("/:id", auth, deleteJob);
router.get("/:id", auth, getSingleJob);

export default router;
