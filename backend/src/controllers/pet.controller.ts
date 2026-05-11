import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { Role } from "../types/auth";

export const getMyPet = async (req: any, res: Response) => {
  try {
    const pet = await prisma.pet.findUnique({
      where: { userId: req.user.id },
    });
    res.json(pet);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy thông tin pet" });
  }
};

export const selectPet = async (req: any, res: Response) => {
  const { type, name } = req.body;
  if (!["MAGE", "FAT", "MESSI"].includes(type)) {
    return res.status(400).json({ message: "Loại pet không hợp lệ" });
  }

  try {
    const existingPet = await prisma.pet.findUnique({
      where: { userId: req.user.id },
    });
    if (existingPet) {
      return res.status(400).json({ message: "Bạn đã có pet rồi" });
    }

    const newPet = await prisma.pet.create({
      data: {
        userId: req.user.id,
        type,
        name: name || (type === "MAGE" ? "Pháp Sư Meo Meo" : type === "FAT" ? "Meow Béo" : "Messi"),
        hp: 150,
        maxHp: 500,
        status: "ALIVE",
      },
    });
    res.status(201).json(newPet);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi chọn pet" });
  }
};

export const useSkill = async (req: any, res: Response) => {
  const userId = req.user.id;
  const { targetUserId } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.skillTokens < 100) {
      return res.status(400).json({ message: "Bạn không đủ 100 Token để thi triển kỹ năng (Làm bài tập để nhận Token)" });
    }

    const pet = await prisma.pet.findUnique({ where: { userId } });
    if (!pet || pet.status === "DEAD") {
      return res.status(400).json({ message: "Pet của bạn không thể dùng kỹ năng" });
    }

    const now = new Date();
    // Removed daily limit to allow token-based usage

    let effectValue = 0;
    let messageToUser = "";
    let messageToTarget = "";

    await prisma.$transaction(async (tx) => {
      // Deduct tokens
      await tx.user.update({
        where: { id: userId },
        data: { skillTokens: { decrement: 100 } }
      });

      if (pet.type === "MAGE") {
        // Lucky Score: 0 -> 45 points
        effectValue = Math.floor(Math.random() * 46);
        await tx.user.update({
          where: { id: userId },
          data: { totalPoints: { increment: effectValue } },
        });
        messageToUser = `Pháp Sư Meo Meo đã cộng cho bạn ${effectValue} điểm. (Tiêu tốn 100 Token)`;
      } else if (pet.type === "FAT") {
        // Point Smash: 1 -> 70 points deduction
        if (!targetUserId || targetUserId === userId) {
          throw new Error("Mục tiêu không hợp lệ");
        }
        effectValue = Math.floor(Math.random() * 70) + 1;
        const targetUser = await tx.user.findUnique({ where: { id: targetUserId } });
        if (!targetUser) throw new Error("Không tìm thấy đối thủ");

        const newPoints = Math.max(0, targetUser.totalPoints - effectValue);
        await tx.user.update({
          where: { id: targetUserId },
          data: { totalPoints: newPoints },
        });

        messageToUser = `Bạn đã dùng Meow Béo trừ ${effectValue} điểm của ${targetUser.name}. (Tiêu tốn 100 Token)`;
        messageToTarget = `Meow Béo của ${req.user.name} đã trừ ${effectValue} điểm của bạn.`;
      } else if (pet.type === "MESSI") {
        // Power Shot: Random HP damage (20-100)
        if (!targetUserId || targetUserId === userId) {
          throw new Error("Mục tiêu không hợp lệ");
        }
        const targetPet = await tx.pet.findUnique({ where: { userId: targetUserId } });
        if (!targetPet || targetPet.status === "DEAD") {
          throw new Error("Đối thủ không có pet hoặc pet đã chết");
        }

        effectValue = Math.floor(Math.random() * 81) + 20;
        const newHp = Math.max(0, targetPet.hp - effectValue);
        const newStatus = newHp <= 0 ? "DEAD" : "ALIVE";

        await tx.pet.update({
          where: { userId: targetUserId },
          data: { hp: newHp, status: newStatus },
        });

        const targetUser = await tx.user.findUnique({ where: { id: targetUserId } });
        messageToUser = `Messi của bạn gây ${effectValue} sát thương lên pet của ${targetUser?.name}. (Tiêu tốn 100 Token)`;
        messageToTarget = `Pet của bạn bị Messi của ${req.user.name} tấn công và mất ${effectValue} HP.`;

        if (newStatus === "DEAD") {
          messageToTarget += " Pet của bạn đã chết!";
        }
      }

      // Update last used time
      await tx.pet.update({
        where: { id: pet.id },
        data: { lastSkillUsedAt: now },
      });

      // Log skill
      await tx.petSkillLog.create({
        data: {
          attackerUserId: userId,
          targetUserId,
          petType: pet.type,
          skillName: pet.type === "MAGE" ? "Lucky Score" : pet.type === "FAT" ? "Point Smash" : "Power Shot",
          effectValue,
        },
      });

      // Create notifications
      await tx.notification.create({
        data: { userId, title: "Kỹ năng Pet", message: messageToUser },
      });
      if (messageToTarget && targetUserId) {
        await tx.notification.create({
          data: { userId: targetUserId, title: "Bị Pet tấn công", message: messageToTarget },
        });
      }
    });

    res.json({ message: messageToUser, effectValue });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Lỗi khi dùng kỹ năng" });
  }
};

export const revivePet = async (req: any, res: Response) => {
  const userId = req.user.id;

  try {
    const pet = await prisma.pet.findUnique({ where: { userId } });
    if (!pet || pet.status === "ALIVE") {
      return res.status(400).json({ message: "Pet của bạn vẫn còn sống" });
    }

    // Check revive progress
    const progress = await prisma.petReviveProgress.findUnique({ where: { userId } });
    if (!progress) {
      return res.status(400).json({ message: "Bạn chưa hoàn thành nhiệm vụ hồi sinh" });
    }

    const completedIds = progress.completedAssignmentIds.split(",").filter(id => id.length > 0);
    if (completedIds.length < 3) {
      return res.status(400).json({ message: `Bạn mới hoàn thành ${completedIds.length}/3 bài tập Medium` });
    }

    // Revive
    await prisma.pet.update({
      where: { userId },
      data: { hp: 500, status: "ALIVE" },
    });

    // Reset progress
    await prisma.petReviveProgress.delete({ where: { userId } });

    await prisma.notification.create({
      data: { userId, title: "Hồi sinh", message: "Chúc mừng! Pet của bạn đã được hồi sinh với 500 HP." },
    });

    res.json({ message: "Hồi sinh pet thành công!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi hồi sinh pet" });
  }
};

export const getTargetList = async (req: any, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { id: { not: req.user.id } },
      select: {
        id: true,
        name: true,
        totalPoints: true,
        pet: true,
      },
      take: 20,
      orderBy: { totalPoints: "desc" },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách mục tiêu" });
  }
};
