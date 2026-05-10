import { Request, Response } from "express";
import prisma from "../utils/prisma";

export const getResources = async (req: any, res: Response) => {
  try {
    const resources = await prisma.resource.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: "Error fetching resources" });
  }
};

export const createResource = async (req: any, res: Response) => {
  const { title, url, type } = req.body;
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const resource = await prisma.resource.create({
      data: {
        title,
        url,
        type,
        userId,
      },
    });
    res.status(201).json(resource);
  } catch (error) {
    res.status(500).json({ message: "Error creating resource" });
  }
};

export const deleteResource = async (req: any, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  try {
    const resource = await prisma.resource.findUnique({ where: { id: String(id) } });
    if (!resource) return res.status(404).json({ message: "Resource not found" });

    // Only creator or Admin can delete
    if (resource.userId !== userId && userRole !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }

    await prisma.resource.delete({ where: { id: String(id) } });
    res.json({ message: "Resource deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting resource" });
  }
};