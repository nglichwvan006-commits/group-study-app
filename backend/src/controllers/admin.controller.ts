import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../utils/prisma";
import { Role } from "../types/auth";

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, name: true, role: true, isMuted: true, createdAt: true },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
};

export const createMember = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
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
    await prisma.user.delete({ where: { id } });
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user" });
  }
};

export const muteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isMuted } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id },
      data: { isMuted },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error updating mute status" });
  }
};

export const sendWarning = async (req: Request, res: Response) => {
  const { userId, message } = req.body;

  try {
    const warning = await prisma.warning.create({
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
