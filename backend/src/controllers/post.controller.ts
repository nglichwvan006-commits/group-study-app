import { Request, Response } from "express";
import prisma from "../utils/prisma";

export const getFeed = async (req: any, res: Response) => {
  const { q } = req.query;
  try {
    const posts = await (prisma as any).post.findMany({
      where: q ? {
        content: { contains: String(q), mode: "insensitive" }
      } : {},
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, badge: true, level: true }
        },
        comments: {
          include: {
            user: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: "asc" }
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
  const { content, imageUrl } = req.body;
  const userId = req.user.id;

  if (!content) return res.status(400).json({ message: "Nội dung không được để trống" });

  try {
    const post = await (prisma as any).post.create({
      data: {
        content,
        imageUrl,
        userId
      },
      include: {
        user: {
          select: { id: true, name: true, badge: true, level: true }
        },
        comments: true
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

export const createComment = async (req: any, res: Response) => {
  const { content, postId } = req.body;
  const userId = req.user.id;

  if (!content) return res.status(400).json({ message: "Bình luận không được để trống" });

  try {
    const comment = await (prisma as any).comment.create({
      data: {
        content,
        postId,
        userId
      },
      include: {
        user: { select: { id: true, name: true } }
      }
    });
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi bình luận" });
  }
};

export const deleteComment = async (req: any, res: Response) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const comment = await (prisma as any).comment.findUnique({ where: { id: String(id) } });
    if (!comment) return res.status(404).json({ message: "Bình luận không tồn tại" });

    if (comment.userId !== userId && userRole !== "ADMIN") {
      return res.status(403).json({ message: "Không có quyền xóa bình luận này" });
    }

    await (prisma as any).comment.delete({ where: { id: String(id) } });
    res.json({ message: "Đã xóa bình luận" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa bình luận" });
  }
};
