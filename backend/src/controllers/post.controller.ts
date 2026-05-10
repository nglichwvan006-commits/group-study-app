import { Request, Response } from "express";
import prisma from "../utils/prisma";

export const getFeed = async (req: any, res: Response) => {
  try {
    const posts = await (prisma as any).post.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, badge: true, level: true }
        }
      },
      take: 50,
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy bảng tin" });
  }
};

export const createPost = async (req: any, res: Response) => {
  const { content } = req.body;
  const userId = req.user.id;

  if (!content) return res.status(400).json({ message: "Nội dung không được để trống" });

  try {
    const post = await (prisma as any).post.create({
      data: {
        content,
        userId
      },
      include: {
        user: {
          select: { id: true, name: true, badge: true, level: true }
        }
      }
    });
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi đăng bài" });
  }
};

export const deletePost = async (req: any, res: Response) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const post = await (prisma as any).post.findUnique({ where: { id: String(id) } });
    if (!post) return res.status(404).json({ message: "Bài viết không tồn tại" });

    if (post.userId !== userId && userRole !== "ADMIN") {
      return res.status(403).json({ message: "Không có quyền xóa bài viết này" });
    }

    await (prisma as any).post.delete({ where: { id: String(id) } });
    res.json({ message: "Đã xóa bài viết" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa bài viết" });
  }
};
