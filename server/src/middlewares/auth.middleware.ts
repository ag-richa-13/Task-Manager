import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../services/token.service";

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ message: "Missing Authorization header" });

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token)
    return res.status(401).json({ message: "Invalid Authorization format" });

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      userId: (payload as any).userId,
      email: (payload as any).email,
    };
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired access token" });
  }
}
