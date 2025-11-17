import jwt, { SignOptions } from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;

const ACCESS_EXP = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
const REFRESH_EXP = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

// options typed correctly for TS + JWT v9
const accessTokenOptions: SignOptions = {
  expiresIn: ACCESS_EXP as any,
};

const refreshTokenOptions: SignOptions = {
  expiresIn: REFRESH_EXP as any,
};

export function signAccessToken(payload: object): string {
  return jwt.sign(payload, ACCESS_SECRET, accessTokenOptions);
}

export function signRefreshToken(payload: object): string {
  return jwt.sign(payload, REFRESH_SECRET, refreshTokenOptions);
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, ACCESS_SECRET) as any;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, REFRESH_SECRET) as any;
}
