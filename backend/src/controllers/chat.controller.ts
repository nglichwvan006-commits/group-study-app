import { Request, Response } from "express";
import prisma from "../utils/prisma";

export const getRooms = async (req: any, res: Response) => {
  try {
    const rooms = await (prisma as any).chatRoom.findMany({
      orderBy: { createdAt: "desc" },
      include: { creator: { select: { name: true } } }
    });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: "Error fetching rooms" });
  }
};

export const createRoom = async (req: any, res: Response) => {
  const { name, code } = req.body;
  const creatorId = req.user.id;

  try {
    const room = await (prisma as any).chatRoom.create({
      data: {
        name,
        code: code.toUpperCase(),
        creatorId
      }
    });
    res.status(201).json(room);
  } catch (error) {
    res.status(400).json({ message: "Mã phòng đã tồn tại hoặc dữ liệu không hợp lệ" });
  }
};

export const deleteRoom = async (req: any, res: Response) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const room = await (prisma as any).chatRoom.findUnique({ where: { id: String(id) } });
    if (!room) return res.status(404).json({ message: "Room not found" });

    if (room.creatorId !== userId && userRole !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }

    await (prisma as any).chatRoom.delete({ where: { id: String(id) } });
    res.json({ message: "Room deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting room" });
  }
};

export const getChatHistory = async (req: Request, res: Response) => {
  const { roomId } = req.query;
  if (!roomId) return res.json([]);
  
  try {
    const messages = await (prisma as any).chatMessage.findMany({
      where: { roomId: String(roomId) },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { name: true, role: true } } },
      take: 100,
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
    const message = await (prisma as any).chatMessage.findUnique({
      where: { id: String(id) },
    });

    if (!message) return res.status(404).json({ message: "Message not found" });

    if (message.userId !== userId && userRole !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }

    await (prisma as any).chatMessage.delete({
      where: { id: String(id) },
    });

    res.json({ message: "Message deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting message" });
  }
};