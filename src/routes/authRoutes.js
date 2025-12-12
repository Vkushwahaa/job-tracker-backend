import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";
import { registerSchema, loginSchema } from "../validators/authSchema.js";
import { validate } from "../middlewares/validate.js";

const router = express.Router();

// register user route
router.post("/register", validate(registerSchema), registerUser);
router.post("/login", validate(loginSchema), loginUser);

export default router;
