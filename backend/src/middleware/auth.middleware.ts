import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { Role } from "../types/auth";
import prisma from "../utils/prisma";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = verifyAccessToken(token);
    
    // Check if user is banned
    const user = await (prisma.user as any).findUnique({
      where: { id: decoded.id },
      select: { bannedUntil: true }
    });

    if (user?.bannedUntil && new Date(user.bannedUntil) > new Date()) {
      return res.status(403).json({ 
        message: "Tài khoản của bạn đã bị khóa!", 
        bannedUntil: user.bannedUntil 
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const authorize = (roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};