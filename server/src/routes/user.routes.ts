import express from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getUserStatistics,
  deleteAccount,
} from "../controllers/user.controller";
import {
  validateUpdateProfile,
  validateChangePassword,
  validateDeleteAccount,
} from "../validators/user.validator";

const router = express.Router();

// All user routes require authentication
router.use(requireAuth);

// Profile routes
router.get("/profile", getUserProfile);
router.put("/profile", validateUpdateProfile, updateUserProfile);

// Settings routes
router.put("/change-password", validateChangePassword, changePassword);
router.delete("/account", validateDeleteAccount, deleteAccount);

// Statistics route
router.get("/statistics", getUserStatistics);

export default router;