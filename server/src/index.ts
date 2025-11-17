import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import authRoutes from "./controllers/auth.controller";
import tasksRoutes from "./controllers/tasks.controller";
import userRoutes from "./routes/user.routes";
import { errorHandler } from "./middlewares/error.middleware";
import dotenv from "dotenv";

dotenv.config();

export const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.get("/", (req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/tasks", tasksRoutes);
app.use("/user", userRoutes);

// error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
