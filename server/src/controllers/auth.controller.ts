import express from "express";
import { validationResult } from "express-validator";
import bcrypt from "bcrypt";
import { prisma } from "../index";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../services/token.service";
import { registerValidator, loginValidator } from "../utils/validators";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const COOKIE_NAME = "refreshToken";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === "true",
  sameSite: "lax" as const,
  path: "/",
};

// POST /auth/register
router.post("/register", registerValidator, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return res.status(400).json({ message: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
    });

    const accessToken = signAccessToken({ userId: user.id, email: user.email });
    const refreshToken = signRefreshToken({
      userId: user.id,
      email: user.email,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    res.cookie(COOKIE_NAME, refreshToken, COOKIE_OPTIONS);
    res.status(201).json({
      accessToken,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/login
router.post("/login", loginValidator, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = signAccessToken({ userId: user.id, email: user.email });
    const refreshToken = signRefreshToken({
      userId: user.id,
      email: user.email,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    res.cookie(COOKIE_NAME, refreshToken, COOKIE_OPTIONS);
    res.json({
      accessToken,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/refresh
router.post("/refresh", async (req, res, next) => {
  try {
    const token = req.cookies[COOKIE_NAME];
    if (!token)
      return res.status(401).json({ message: "Missing refresh token" });

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch (e) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const user = await prisma.user.findUnique({
      where: { id: (payload as any).userId },
    });
    if (!user || user.refreshToken !== token)
      return res.status(401).json({ message: "Invalid refresh token" });

    const accessToken = signAccessToken({ userId: user.id, email: user.email });
    const newRefreshToken = signRefreshToken({
      userId: user.id,
      email: user.email,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    res.cookie(COOKIE_NAME, newRefreshToken, COOKIE_OPTIONS);
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
});

// POST /auth/logout
router.post("/logout", async (req, res, next) => {
  try {
    const token = req.cookies[COOKIE_NAME];
    if (token) {
      try {
        const payload = verifyRefreshToken(token);
        await prisma.user.update({
          where: { id: (payload as any).userId },
          data: { refreshToken: null },
        });
      } catch (e) {
        // invalid token - ignore
      }
    }
    res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
    res.json({ message: "Logged out" });
  } catch (err) {
    next(err);
  }
});

export default router;
