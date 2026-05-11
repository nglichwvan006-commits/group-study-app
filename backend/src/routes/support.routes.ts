import { Router } from "express";
import prisma from "../utils/prisma";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Public: Send a message
router.post("/", async (req: any, res) => {
  const { name, email, message, userId } = req.body;
  try {
    const newMessage = await prisma.supportMessage.create({
      data: { name, email, message, userId: userId || null }
    });
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi gửi tin nhắn" });
  }
});

// Admin: Get all messages
router.get("/", authenticate as any, async (req: any, res) => {
  if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Forbidden" });
  try {
    const messages = await prisma.supportMessage.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } }
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách tin nhắn" });
  }
});

// Admin: Reply to a message
router.patch("/:id/reply", authenticate as any, async (req: any, res) => {
  if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Forbidden" });
  const { reply } = req.body;
  const { id } = req.params;
  try {
    const updated = await prisma.supportMessage.update({
      where: { id },
      data: { reply, status: "REPLIED" }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi phản hồi" });
  }
});

// User/Guest: Check reply by email or guest ID
router.get("/check", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.json([]);
  try {
    const messages = await prisma.supportMessage.findMany({
      where: { email: String(email) },
      orderBy: { createdAt: "desc" }
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi kiểm tra phản hồi" });
  }
});

export default router;
