import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../utils/prisma";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { JWTPayload, Role } from "../types/auth";

export const registerMember = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  try {
    const existingUser = await (prisma.user as any).findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email này đã được sử dụng" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await (prisma.user as any).create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: Role.MEMBER,
      },
    });

    // Create welcome notification from Admin
    try {
      const admin = await (prisma.user as any).findFirst({ where: { role: Role.ADMIN } });
      await (prisma as any).notification.create({
        data: {
          userId: user.id,
          senderId: admin?.id,
          title: "Chào mừng thành viên mới! ✨",
          message: `Chào mừng ${user.name} đã gia nhập cộng đồng Vibe Coding! Chúc bạn có những trải nghiệm học tập và rèn luyện thú vị tại đây. Hãy bắt đầu bằng cách hoàn thành các thử thách lập trình để thăng hạng nhé!`,
        }
      });
    } catch (nError) {
      console.error("Welcome notification error:", nError);
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

    res.status(201).json({ 
      accessToken, 
      refreshToken, 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        totalPoints: user.totalPoints,
        level: user.level,
        badge: user.badge,
        skillTokens: user.skillTokens
      } 
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi đăng ký tài khoản" });
  }
};

export const loginMember = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await (prisma.user as any).findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    // Support both Google login (no password) and local login
    if (user.password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
      }
    } else {
      return res.status(401).json({ message: "Tài khoản này yêu cầu đăng nhập bằng Google" });
    }

    const payload: JWTPayload = { id: user.id, email: user.email, role: user.role as Role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    res.json({ 
      accessToken, 
      refreshToken, 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        totalPoints: (user as any).totalPoints,
        level: (user as any).level,
        badge: (user as any).badge,
        skillTokens: (user as any).skillTokens
      } 
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi đăng nhập" });
  }
};

export const googleCallback = async (req: Request, res: Response) => {
  const user = (req as any).user;
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

  // Redirect to frontend with tokens
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  res.redirect(`${frontendUrl}/auth-success?accessToken=${accessToken}&refreshToken=${refreshToken}&user=${encodeURIComponent(JSON.stringify(user))}`);
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: "No refresh token" });

  try {
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }

    const payload: JWTPayload = { id: storedToken.user.id, email: storedToken.user.email, role: storedToken.user.role as Role };
    const accessToken = generateAccessToken(payload);

    res.json({ accessToken });
  } catch (error) {
    res.status(401).json({ message: "Invalid refresh token" });
  }
};

export const getMe = async (req: any, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const user = await (prisma.user as any).findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, totalPoints: true, level: true, badge: true, skillTokens: true },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user" });
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