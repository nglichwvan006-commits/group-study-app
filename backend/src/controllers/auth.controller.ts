import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../utils/prisma";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { JWTPayload, Role } from "../types/auth";

export const loginMember = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.role !== Role.MEMBER || !user.password) {
      return res.status(401).json({ message: "Invalid credentials or unauthorized" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const payload: JWTPayload = { id: user.id, email: user.email, role: user.role as Role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    res.json({ accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const googleCallback = async (req: Request, res: Response) => {
  const user = req.user as any;
  if (!user) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=unauthorized`);
  }

  const payload: JWTPayload = { id: user.id, email: user.email, role: user.role as Role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Store refresh token
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  // Redirect to frontend with tokens (or use cookies)
  // For simplicity in this demo, I'll pass them in query params, though cookies are safer
  res.redirect(`${process.env.FRONTEND_URL}/auth-success?accessToken=${accessToken}&refreshToken=${refreshToken}`);
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token required" });
  }

  try {
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }

    const payload: JWTPayload = {
      id: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role as Role,
    };
    const newAccessToken = generateAccessToken(payload);

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(401).json({ message: "Invalid refresh token" });
  }
};

export const getMe = async (req: any, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, role: true, isMuted: true },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }
  res.json({ message: "Logged out" });
};
