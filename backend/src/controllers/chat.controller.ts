import { Request, Response } from "express";
import prisma from "../utils/prisma";

export const getChatHistory = async (req: Request, res: Response) => {
  const { roomId = "general" } = req.query;
  
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { roomId: String(roomId) },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { name: true, role: true } } },
      take: 100, // Limit to last 100 messages
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Error fetching chat history" });
  }
};

export const deleteMessage = async (req: any, res: any) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const message = await prisma.chatMessage.findUnique({
      where: { id },
    });

    if (!message) return res.status(404).json({ message: "Message not found" });

    // Only creator or Admin can delete
    if (message.userId !== userId && userRole !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }

    await prisma.chatMessage.delete({
      where: { id },
    });

    res.json({ message: "Message deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting message" });
  }
};
