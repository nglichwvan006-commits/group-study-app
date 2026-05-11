import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../utils/prisma";
import { Role } from "../types/auth";

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, name: true, role: true, isMuted: true, bannedUntil: true, createdAt: true, totalPoints: true, level: true, badge: true, avatarUrl: true },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
};

export const createMember = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  try {
    const existingUser = await (prisma.user as any).findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await (prisma.user as any).create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: Role.MEMBER,
      },
    });

    res.status(201).json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (error) {
    res.status(500).json({ message: "Error creating member" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await (prisma.user as any).delete({ where: { id: String(id) } });
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user" });
  }
};

export const muteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isMuted } = req.body;

  try {
    const user = await (prisma.user as any).update({
      where: { id: String(id) },
      data: { isMuted },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error updating mute status" });
  }
};

export const banUser = async (req: any, res: Response) => {
  const { id } = req.params;
  const { bannedUntil } = req.body; // ISO string or null

  try {
    const user = await (prisma.user as any).update({
      where: { id: String(id) },
      data: { bannedUntil: bannedUntil ? new Date(bannedUntil) : null },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error banning user" });
  }
};

export const changeUserPassword = async (req: any, res: Response) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password) return res.status(400).json({ message: "Password is required" });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await (prisma.user as any).update({
      where: { id: String(id) },
      data: { password: hashedPassword },
    });
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error changing password" });
  }
};

export const resetUserPoints = async (req: any, res: Response) => {
  const { id } = req.params;

  try {
    await (prisma.user as any).update({
      where: { id: String(id) },
      data: { totalPoints: 0, level: 1, badge: "Bronze" },
    });
    
    // Also delete all their graded submissions to keep sync
    await (prisma as any).submission.deleteMany({
      where: { userId: String(id) }
    });

    res.json({ message: "User points reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error resetting user points" });
  }
};

export const resetAllPoints = async (req: any, res: Response) => {
  const { password } = req.body;

  if (password !== "412006") {
    return res.status(403).json({ message: "Mật khẩu xác nhận reset không chính xác!" });
  }

  try {
    await prisma.$transaction([
      (prisma.user as any).updateMany({
        data: { totalPoints: 0, level: 1, badge: "Bronze" },
      }),
      (prisma as any).submission.deleteMany({}),
    ]);
    res.json({ message: "Tất cả điểm số hệ thống đã được reset!" });
  } catch (error) {
    res.status(500).json({ message: "Error resetting all points" });
  }
};

export const sendWarning = async (req: Request, res: Response) => {
  const { userId, message } = req.body;

  try {
    const warning = await (prisma as any).warning.create({
      data: {
        userId,
        message,
      },
    });
    res.status(201).json(warning);
  } catch (error) {
    res.status(500).json({ message: "Error sending warning" });
  }
};

export const sendNotification = async (req: any, res: Response) => {
  const { userId, title, message } = req.body;
  const adminId = req.user?.id;

  try {
    const notification = await (prisma as any).notification.create({
      data: {
        userId,
        senderId: adminId,
        title,
        message,
      },
    });

    // Also create a "Warning" entry if system uses it for notifications
    await (prisma as any).warning.create({
      data: {
        userId,
        message: `[THÔNG BÁO] ${title}: ${message}`,
      }
    });

    res.status(201).json(notification);
  } catch (error) {
    console.error("Notification Error:", error);
    res.status(500).json({ message: "Error sending notification" });
  }
};

export const syncAllUsersXP = async (req: Request, res: Response) => {
  try {
    const users = await (prisma.user as any).findMany();

    await prisma.$transaction(async (tx) => {
      for (const user of users) {
        // Find best score for each assignment for this user
        const submissions = await (tx as any).submission.findMany({
          where: { 
            userId: user.id,
            status: "GRADED"
          },
          select: { assignmentId: true, score: true }
        });

        // Group by assignment and take the max score (in case of multiple graded submissions)
        const bestScores: { [key: string]: number } = {};
        submissions.forEach((s: any) => {
          if (!bestScores[s.assignmentId] || (s.score || 0) > bestScores[s.assignmentId]) {
            bestScores[s.assignmentId] = s.score || 0;
          }
        });

        const newPoints = Object.values(bestScores).reduce((a: number, b: number) => a + b, 0);
        const newLevel = Math.floor(newPoints / 2000) + 1;
        
        let newBadge = "Bronze";
        if (newPoints >= 10000) newBadge = "Master";
        else if (newPoints >= 5000) newBadge = "Diamond";
        else if (newPoints >= 3000) newBadge = "Platinum";
        else if (newPoints >= 1500) newBadge = "Gold";
        else if (newPoints >= 500) newBadge = "Silver";

        await (tx as any).user.update({
          where: { id: user.id },
          data: { totalPoints: newPoints, level: newLevel, badge: newBadge }
        });
      }
    });

    res.json({ message: "All users' XP synchronized successfully" });
  } catch (error) {
    console.error("Error syncing XP:", error);
    res.status(500).json({ message: "Error synchronizing XP" });
  }
};

export const overrideScore = async (req: any, res: any) => {
  const { id } = req.params;
  const { score, feedback } = req.body;

  try {
    const submission = await (prisma as any).submission.findUnique({
      where: { id: String(id) },
      include: { assignment: true, user: true },
    });

    if (!submission) return res.status(404).json({ message: "Submission not found" });

    const clampedScore = Math.max(0, Math.min(score, submission.assignment.maxScore));

    await prisma.$transaction(async (tx) => {
      await (tx as any).submission.update({
        where: { id: String(id) },
        data: {
          score: clampedScore,
          feedback: feedback || "Chấm điểm thủ công bởi Admin.",
          status: "GRADED",
          gradedAt: new Date(),
        },
      });

      // Recalculate full XP for this user automatically from all best graded submissions
      const allUserSubmissions = await (tx as any).submission.findMany({
        where: { userId: submission.userId, status: "GRADED" },
        select: { assignmentId: true, score: true }
      });

      const bestScores: { [key: string]: number } = {};
      allUserSubmissions.forEach((s: any) => {
        if (!bestScores[s.assignmentId] || (s.score || 0) > bestScores[s.assignmentId]) {
          bestScores[s.assignmentId] = s.score || 0;
        }
      });

      const newPoints = Object.values(bestScores).reduce((a: number, b: number) => a + b, 0);
      const newLevel = Math.floor(newPoints / 2000) + 1;
      
      let newBadge = "Bronze";
      if (newPoints >= 10000) newBadge = "Master";
      else if (newPoints >= 5000) newBadge = "Diamond";
      else if (newPoints >= 3000) newBadge = "Platinum";
      else if (newPoints >= 1500) newBadge = "Gold";
      else if (newPoints >= 500) newBadge = "Silver";

      await (tx as any).user.update({
        where: { id: submission.userId },
        data: { totalPoints: newPoints, level: newLevel, badge: newBadge },
      });
    });

    res.json({ message: "Score updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating score" });
  }
};

export const forceGenerateQuiz = async (req: Request, res: Response) => {
  try {
    await DailyQuizService.generateTodayQuiz();
    res.json({ message: "Đã kích hoạt tạo quiz hằng ngày thành công!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tạo quiz" });
  }
};