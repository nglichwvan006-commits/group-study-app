import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../utils/prisma";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { JWTPayload, Role } from "../types/auth";

export const loginMember = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.role !== Role.MEMBER || !user.password) {
      return res.status(401).json({ message: "Thông tin đăng nhập không hợp lệ" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Mật khẩu không đúng" });
    }

    const payload: JWTPayload = { id: user.id, email: user.email, role: user.role as Role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({ accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Lỗi hệ thống khi đăng nhập", error: String(error) });
  }
};

export const googleCallback = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    if (!user) {
      console.error("Google Auth: No user in request");
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=unauthorized`);
    }

    const payload: JWTPayload = { id: user.id, email: user.email, role: user.role as Role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.redirect(`${process.env.FRONTEND_URL}/auth-success?accessToken=${accessToken}&refreshToken=${refreshToken}`);
  } catch (error) {
    console.error("Google Callback Error:", error);
    res.status(500).send(`Lỗi đăng nhập Google: ${String(error)}`);
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ message: "Yêu cầu mã refresh token" });

  try {
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      return res.status(401).json({ message: "Mã phiên làm việc hết hạn" });
    }

    const payload: JWTPayload = {
      id: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role as Role,
    };
    const newAccessToken = generateAccessToken(payload);
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(401).json({ message: "Mã không hợp lệ" });
  }
};

export const getMe = async (req: any, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Chưa xác thực" });

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, role: true, isMuted: true, totalPoints: true, level: true, badge: true },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy thông tin người dùng" });
  }
};

export const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  try {
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    res.json({ message: "Đã đăng xuất" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi đăng xuất" });
  }
};
