import { Response } from "express";
import prisma from "../utils/prisma";

export const getMailbox = async (req: any, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy hộp thư" });
  }
};

export const markRead = async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.notification.update({
      where: { id, userId: req.user.id },
      data: { isRead: true },
    });
    res.json({ message: "Đã đánh dấu đã đọc" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật trạng thái" });
  }
};

export const markAllRead = async (req: any, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    res.json({ message: "Đã đánh dấu tất cả là đã đọc" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật hộp thư" });
  }
};

export const deleteMail = async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.notification.delete({
      where: { id, userId: req.user.id },
    });
    res.json({ message: "Đã xóa thư" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa thư" });
  }
};
