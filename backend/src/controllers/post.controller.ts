import { Request, Response } from "express";
import prisma from "../utils/prisma";

export const getFeed = async (req: any, res: Response) => {
  const { q, skip = 0, take = 20 } = req.query;
  const userId = req.user?.id;
  try {
    const posts = await (prisma as any).post.findMany({
      where: q ? {
        content: { contains: String(q) }
      } : {},
      orderBy: [
        { isPinned: "desc" },
        { createdAt: "desc" }
      ],
      select: {
        id: true,
        content: true,
        imageUrl: true,
        isPinned: true,
        createdAt: true,
        userId: true,
        user: {
          select: { id: true, name: true, badge: true, level: true, avatarUrl: true, role: true }
        },
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            userId: true,
            user: { select: { id: true, name: true, avatarUrl: true } }
          },
          orderBy: { createdAt: "asc" }
        },
        likes: {
          select: { userId: true }
        }
      },
      skip: Number(skip),
      take: Number(take),
    });

    const formattedPosts = posts.map((p: any) => ({
      ...p,
      likeCount: p.likes.length,
      isLiked: userId ? p.likes.some((l: any) => l.userId === userId) : false,
      likes: undefined
    }));

    res.json(formattedPosts);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy bảng tin" });
  }
};

export const createPost = async (req: any, res: Response) => {
  const { content, imageUrl } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  if (!content) return res.status(400).json({ message: "Nội dung không được để trống" });

  try {
    const post = await (prisma as any).post.create({
      data: {
        content,
        imageUrl,
        userId,
        isPinned: userRole === "ADMIN" // Auto-pin if admin
      },
      include: {
        user: {
          select: { id: true, name: true, badge: true, level: true, role: true }
        },
        comments: true,
        likes: true
      }
    });
    res.status(201).json({ ...post, likeCount: 0, isLiked: false });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi đăng bài" });
  }
};

export const toggleLike = async (req: any, res: Response) => {
  const { id: postId } = req.params;
  const userId = req.user.id;

  try {
    const existingLike = await (prisma as any).like.findUnique({
      where: {
        postId_userId: { postId, userId }
      }
    });

    if (existingLike) {
      await (prisma as any).like.delete({
        where: { id: existingLike.id }
      });
      res.json({ liked: false });
    } else {
      await (prisma as any).like.create({
        data: { postId, userId }
      });
      res.json({ liked: true });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi thả tim" });
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
