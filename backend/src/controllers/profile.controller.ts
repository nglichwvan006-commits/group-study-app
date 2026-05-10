import { Request, Response } from "express";
import prisma from "../utils/prisma";

export const searchUsers = async (req: any, res: Response) => {
  const { q } = req.query;
  try {
    const users = await (prisma.user as any).findMany({
      where: {
        OR: [
          { name: { contains: String(q), mode: "insensitive" } },
          { email: { contains: String(q), mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, badge: true, level: true, totalPoints: true },
      take: 20,
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Lỗi tìm kiếm người dùng" });
  }
};

export const getProfile = async (req: any, res: Response) => {
  const { id } = req.params;
  const currentUserId = req.user?.id;
  try {
    const user = await (prisma.user as any).findUnique({
      where: { id: String(id) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        totalPoints: true,
        level: true,
        badge: true,
        age: true,
        school: true,
        className: true,
        studentId: true,
        gender: true,
        bio: true,
        createdAt: true,
        submissions: {
          include: { assignment: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        posts: {
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { id: true, name: true, badge: true, level: true } },
            comments: {
              include: { user: { select: { id: true, name: true } } },
              orderBy: { createdAt: "asc" }
            },
            likes: { select: { userId: true } }
          }
        },
      },
    });

    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    // Format posts
    const formattedPosts = user.posts.map((p: any) => ({
      ...p,
      likeCount: p.likes.length,
      isLiked: currentUserId ? p.likes.some((l: any) => l.userId === currentUserId) : false,
      likes: undefined
    }));

    res.json({ ...user, posts: formattedPosts });
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy thông tin trang cá nhân" });
  }
};

export const updateMyProfile = async (req: any, res: Response) => {
  const userId = req.user.id;
  const { age, school, className, studentId, gender, bio, name } = req.body;

  try {
    const updated = await (prisma.user as any).update({
      where: { id: userId },
      data: {
        name,
        age: age ? parseInt(age) : null,
        school,
        className,
        studentId,
        gender,
        bio,
      },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật thông tin cá nhân" });
  }
};
