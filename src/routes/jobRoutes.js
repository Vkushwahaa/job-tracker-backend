import express from "express";
import { auth } from "../middlewares/auth.js";
import {
  createJob,
  updateJob,
  getJobs,
  deleteJob,
  getSingleJob,
<<<<<<< HEAD
  approveGmailJob,
} from "../controllers/jobController.js";
import { createJobSchema, updateJobSchema } from "../validators/jobSchema.js";
import { validate } from "../middlewares/validate.js";

const router = express.Router();

router.post("/", auth, validate(createJobSchema), createJob);
router.get("/", auth, getJobs);
router.put("/:id", auth, validate(updateJobSchema), updateJob);
router.delete("/:id", auth, deleteJob);
router.get("/:id", auth, getSingleJob);
router.post("/:id/approve-gmail", auth, approveGmailJob);
=======
} from "../controllers/jobController.js";

const router = express.Router();

router.post("/", auth, createJob);
router.get("/", auth, getJobs);
router.put("/:id", auth, updateJob);
router.delete("/:id", auth, deleteJob);
router.get("/:id", auth, getSingleJob);
>>>>>>> main

export default router;
