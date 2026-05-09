import jwt from "jsonwebtoken";
import { JWTPayload } from "../types/auth";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "access_secret";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "refresh_secret";

export const generateAccessToken = (payload: JWTPayload) => {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
};

export const generateRefreshToken = (payload: JWTPayload) => {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
};

export const verifyAccessToken = (token: string): JWTPayload => {
  return jwt.verify(token, ACCESS_TOKEN_SECRET) as JWTPayload;
};

export const verifyRefreshToken = (token: string): JWTPayload => {
  return jwt.verify(token, REFRESH_TOKEN_SECRET) as JWTPayload;
};
