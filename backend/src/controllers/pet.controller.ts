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
        hp: 1000,
        maxHp: 1000,
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
    const pet = await prisma.pet.findUnique({ where: { userId } });
    if (!pet || pet.status === "DEAD") {
      return res.status(400).json({ message: "Pet của bạn không thể dùng kỹ năng" });
    }

    // Check if skill used today
    const now = new Date();
    if (pet.lastSkillUsedAt) {
      const lastUsed = new Date(pet.lastSkillUsedAt);
      if (lastUsed.toDateString() === now.toDateString()) {
        return res.status(400).json({ message: "Bạn đã dùng kỹ năng hôm nay rồi" });
      }
    }

    let effectValue = 0;
    let messageToUser = "";
    let messageToTarget = "";

    if (pet.type === "MAGE") {
      // Lucky Score: 0 -> 45 points
      effectValue = Math.floor(Math.random() * 46);
      await prisma.user.update({
        where: { id: userId },
        data: { totalPoints: { increment: effectValue } },
      });
      messageToUser = `Pháp Sư Meo Meo đã cộng cho bạn ${effectValue} điểm.`;
    } else if (pet.type === "FAT") {
      // Point Smash: 1 -> 70 points deduction
      if (!targetUserId || targetUserId === userId) {
        return res.status(400).json({ message: "Mục tiêu không hợp lệ" });
      }
      effectValue = Math.floor(Math.random() * 70) + 1;
      const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
      if (!targetUser) return res.status(404).json({ message: "Không tìm thấy đối thủ" });

      const newPoints = Math.max(0, targetUser.totalPoints - effectValue);
      await prisma.user.update({
        where: { id: targetUserId },
        data: { totalPoints: newPoints },
      });

      messageToUser = `Bạn đã dùng Meow Béo trừ ${effectValue} điểm của ${targetUser.name}.`;
      messageToTarget = `Meow Béo của ${req.user.name} đã trừ ${effectValue} điểm của bạn.`;
    } else if (pet.type === "MESSI") {
      // Power Shot: 35% HP damage
      if (!targetUserId || targetUserId === userId) {
        return res.status(400).json({ message: "Mục tiêu không hợp lệ" });
      }
      const targetPet = await prisma.pet.findUnique({ where: { userId: targetUserId } });
      if (!targetPet || targetPet.status === "DEAD") {
        return res.status(400).json({ message: "Đối thủ không có pet hoặc pet đã chết" });
      }

      effectValue = Math.floor(targetPet.hp * 0.35);
      const newHp = Math.max(0, targetPet.hp - effectValue);
      const newStatus = newHp <= 0 ? "DEAD" : "ALIVE";

      await prisma.pet.update({
        where: { userId: targetUserId },
        data: { hp: newHp, status: newStatus },
      });

      const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
      messageToUser = `Messi của bạn gây ${effectValue} sát thương lên pet của ${targetUser?.name}.`;
      messageToTarget = `Pet của bạn bị Messi của ${req.user.name} tấn công và mất ${effectValue} HP.`;
      
      if (newStatus === "DEAD") {
        messageToTarget += " Pet của bạn đã chết!";
      }
    }

    // Update last used time
    await prisma.pet.update({
      where: { id: pet.id },
      data: { lastSkillUsedAt: now },
    });

    // Log skill
    await prisma.petSkillLog.create({
      data: {
        attackerUserId: userId,
        targetUserId,
        petType: pet.type,
        skillName: pet.type === "MAGE" ? "Lucky Score" : pet.type === "FAT" ? "Point Smash" : "Power Shot",
        effectValue,
      },
    });

    // Create notifications
    await prisma.notification.create({
      data: { userId, title: "Kỹ năng Pet", message: messageToUser },
    });
    if (messageToTarget && targetUserId) {
      await prisma.notification.create({
        data: { userId: targetUserId, title: "Bị Pet tấn công", message: messageToTarget },
      });
    }

    res.json({ message: messageToUser, effectValue });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi dùng kỹ năng" });
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
