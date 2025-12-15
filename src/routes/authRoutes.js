import express from "express";
import {
  registerUser,
  loginUser,
  refreshToken,
  logout,
  getMe,
} from "../controllers/authController.js";
import { registerSchema, loginSchema } from "../validators/authSchema.js";
import { validate } from "../middlewares/validate.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

// register user route
router.post("/register", validate(registerSchema), registerUser);
router.post("/login", validate(loginSchema), loginUser);
router.post("/refresh", refreshToken);
router.post("/logout", logout);
router.get("/me", auth, getMe);
export default router;
