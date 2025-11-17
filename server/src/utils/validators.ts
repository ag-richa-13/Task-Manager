import { body } from "express-validator";

// --- AUTH VALIDATORS ---
export const registerValidator = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

export const loginValidator = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

// --- TASK VALIDATORS ---
export const createTaskValidator = [
  body("title").trim().notEmpty().withMessage("Task title is required"),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high"])
    .withMessage("Priority must be low, medium, or high"),
  body("status")
    .optional()
    .isIn(["pending", "completed"])
    .withMessage("Status must be pending or completed"),
  body("dueDate")
    .optional()
    .isISO8601()
    .withMessage("Due date must be a valid date"),
];

export const updateTaskValidator = [
  body("title").optional().isString(),
  body("description").optional().isString(),
  body("priority").optional().isIn(["low", "medium", "high"]),
  body("status").optional().isIn(["pending", "completed"]),
  body("dueDate").optional().isISO8601(),
];
