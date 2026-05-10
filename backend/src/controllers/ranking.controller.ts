import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/auth.middleware";

export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const users = await (prisma.user as any).findMany({
      where: {
        totalPoints: { gt: 0 }
      },
      orderBy: { totalPoints: "desc" },
      select: { id: true, name: true, totalPoints: true, level: true, badge: true },
      take: 100,
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching leaderboard" });
  }
};

export const getNotifications = async (req: any, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const notifications = await (prisma as any).notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Error fetching notifications" });
  }
};

export const markNotificationsRead = async (req: any, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    await (prisma as any).notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    res.json({ message: "Notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Error updating notifications" });
  }
};

export const replyToNotification = async (req: any, res: Response) => {
  const { id } = req.params;
  const { message } = req.body;
  const userId = req.user?.id;

  try {
    const original = await (prisma as any).notification.findUnique({
      where: { id: String(id), userId },
    });

    if (!original || !original.senderId) {
      return res.status(404).json({ message: "Original notification not found or cannot be replied to" });
    }

    const reply = await (prisma as any).notification.create({
      data: {
        userId: original.senderId,
        senderId: userId,
        title: `Phản hồi: ${original.title}`,
        message: message,
      },
    });

    res.status(201).json(reply);
  } catch (error) {
    res.status(500).json({ message: "Error replying to notification" });
  }
};